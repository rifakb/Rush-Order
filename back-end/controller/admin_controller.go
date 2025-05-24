package controller

import (
	"net/http"
	"time"

	"RushOrder/config"
	"RushOrder/models"

	"github.com/gin-gonic/gin"
)

// AdminLoginHandler handles admin authentication
func AdminLoginHandler(c *gin.Context) {
	var loginData struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Simple authentication (in production, use proper hashing)
	if loginData.Username == "admin" && loginData.Password == "password123" {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Login successful",
			"admin": gin.H{
				"id":       1,
				"username": loginData.Username,
				"name":     "Administrator",
			},
		})
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "Invalid username or password",
		})
	}
}

// GetDashboardStatsHandler returns dashboard statistics
func GetDashboardStatsHandler(c *gin.Context) {
	var stats struct {
		PendingOrders   int64   `json:"pendingOrders"`
		CompletedOrders int64   `json:"completedOrders"`
		TotalOrders     int64   `json:"totalOrders"`
		TotalRevenue    float64 `json:"totalRevenue"`
	}

	db := config.GetDB()

	// Count pending orders
	db.Model(&models.Order{}).Where("status = ?", "pending").Count(&stats.PendingOrders)

	// Count completed orders
	db.Model(&models.Order{}).Where("status = ?", "completed").Count(&stats.CompletedOrders)

	// Total orders
	stats.TotalOrders = stats.PendingOrders + stats.CompletedOrders

	// Calculate total revenue from completed orders
	var revenue float64
	db.Model(&models.Order{}).Where("status = ?", "completed").Select("COALESCE(SUM(total_amount), 0)").Scan(&revenue)
	stats.TotalRevenue = revenue

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetAllOrdersHandler returns all orders with filtering
func GetAllOrdersHandler(c *gin.Context) {
	status := c.Query("status")

	var orders []models.Order
	db := config.GetDB()

	query := db.Preload("Items").Preload("Items.Product").Preload("Customer")

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch orders",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
	})
}

// GetOrderDetailHandler returns detailed information about a specific order
func GetOrderDetailHandler(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	db := config.GetDB()

	if err := db.Preload("Items").Preload("Items.Product").Preload("Customer").
		First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
	})
}

// CompleteOrderHandler marks an order as completed
func CompleteOrderHandler(c *gin.Context) {
	orderID := c.Param("id")

	db := config.GetDB()

	// Update order status
	result := db.Model(&models.Order{}).Where("id = ?", orderID).Updates(map[string]interface{}{
		"status":       "completed",
		"completed_at": time.Now(),
	})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update order status",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Order not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order marked as completed",
	})
}

// DeleteOrderHandler deletes an order (admin only)
func DeleteOrderHandler(c *gin.Context) {
	orderID := c.Param("id")

	db := config.GetDB()

	// Start transaction
	tx := db.Begin()

	// Delete order items first (foreign key constraint)
	if err := tx.Where("order_id = ?", orderID).Delete(&models.OrderItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete order items",
		})
		return
	}

	// Delete the order
	result := tx.Delete(&models.Order{}, orderID)
	if result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete order",
		})
		return
	}

	if result.RowsAffected == 0 {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Order not found",
		})
		return
	}

	// Commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Order deleted successfully",
	})
}

// Additional helper handlers for products, customers, etc.

// GetAllProductsHandler returns all products
func GetAllProductsHandler(c *gin.Context) {
	var products []models.Produk
	db := config.GetDB()

	if err := db.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to fetch products",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    products,
	})
}

// GetProductHandler returns a specific product
func GetProductHandler(c *gin.Context) {
	productID := c.Param("id")

	var product models.Produk
	db := config.GetDB()

	if err := db.First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Product not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    product,
	})
}

// CreateProductHandler creates a new product
func CreateProductHandler(c *gin.Context) {
	var product models.Produk

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	db := config.GetDB()
	if err := db.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create product",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    product,
		"message": "Product created successfully",
	})
}

// UpdateProductHandler updates an existing product
func UpdateProductHandler(c *gin.Context) {
	productID := c.Param("id")

	var product models.Produk
	db := config.GetDB()

	if err := db.First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Product not found",
		})
		return
	}

	var updateData models.Produk
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	if err := db.Model(&product).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to update product",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    product,
		"message": "Product updated successfully",
	})
}

// DeleteProductHandler deletes a product
func DeleteProductHandler(c *gin.Context) {
	productID := c.Param("id")

	db := config.GetDB()

	result := db.Delete(&models.Produk{}, productID)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to delete product",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Product not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Product deleted successfully",
	})
}
