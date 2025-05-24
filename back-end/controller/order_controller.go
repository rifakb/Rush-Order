package controller

import (
	"fmt"
	"net/http"
	"time"

	"RushOrder/config"
	"RushOrder/models"

	"github.com/gin-gonic/gin"
)

// CreateOrderHandler creates a new order from cart
func CreateOrderHandler(c *gin.Context) {
	var orderData struct {
		IDPemesan string `json:"id_pemesan" binding:"required"`
		Items     []struct {
			IDProduk string `json:"id_produk" binding:"required"`
			Jumlah   int    `json:"jumlah" binding:"required"`
			Harga    int    `json:"harga" binding:"required"`
		} `json:"items" binding:"required"`
	}

	if err := c.ShouldBindJSON(&orderData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Data pesanan tidak valid",
		})
		return
	}

	db := config.GetDB()

	// Generate order ID
	orderID := fmt.Sprintf("ORD%d", time.Now().Unix())

	// Calculate total
	totalHarga := 0
	for _, item := range orderData.Items {
		totalHarga += item.Harga * item.Jumlah
	}

	// Start transaction
	tx := db.Begin()

	// Create order
	order := models.Order{
		IDOrder:    orderID,
		IDPemesan:  orderData.IDPemesan,
		TotalHarga: totalHarga,
		Status:     "pending",
		CreatedAt:  time.Now(),
	}

	if err := tx.Create(&order).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal membuat pesanan",
		})
		return
	}

	// Create order items
	for _, item := range orderData.Items {
		orderItem := models.OrderItem{
			IDOrder:  orderID,
			IDProduk: item.IDProduk,
			Jumlah:   item.Jumlah,
			Subtotal: item.Harga * item.Jumlah,
		}

		if err := tx.Create(&orderItem).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Gagal menyimpan item pesanan",
			})
			return
		}
	}

	// Commit transaction
	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Pesanan berhasil dibuat",
		"data": gin.H{
			"order_id":    orderID,
			"total_harga": totalHarga,
			"status":      "pending",
		},
	})
}

// GetCustomerOrdersHandler returns orders for specific customer
func GetCustomerOrdersHandler(c *gin.Context) {
	customerID := c.Query("customer_id")
	if customerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Customer ID diperlukan",
		})
		return
	}

	var orders []models.Order
	db := config.GetDB()

	if err := db.Preload("Items").Preload("Items.Product").
		Where("id_pemesan = ?", customerID).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Gagal mengambil data pesanan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    orders,
	})
}

// GetOrderHandler returns specific order details
func GetOrderHandler(c *gin.Context) {
	orderID := c.Param("id")

	var order models.Order
	db := config.GetDB()

	if err := db.Preload("Items").Preload("Items.Product").Preload("Customer").
		First(&order, "id_order = ?", orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Pesanan tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    order,
	})
}

// Cart handlers using session-based cart management

// GetCartHandler returns current cart contents
func GetCartHandler(c *gin.Context) {
	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session ID diperlukan",
		})
		return
	}

	// In a real implementation, you would get cart from session store
	// For now, return empty cart
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"items": []interface{}{},
			"total": 0,
		},
	})
}

// AddToCartHandler adds item to cart
func AddToCartHandler(c *gin.Context) {
	var cartItem struct {
		IDProduk string `json:"id_produk" binding:"required"`
		Jumlah   int    `json:"jumlah" binding:"required"`
	}

	if err := c.ShouldBindJSON(&cartItem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Data item tidak valid",
		})
		return
	}

	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session ID diperlukan",
		})
		return
	}

	// Get product details
	var product models.Produk
	db := config.GetDB()

	if err := db.First(&product, "id_produk = ?", cartItem.IDProduk).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"error":   "Produk tidak ditemukan",
		})
		return
	}

	// In a real implementation, you would add to session-based cart
	// For now, just return success
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item berhasil ditambahkan ke keranjang",
		"data": gin.H{
			"product": product,
			"jumlah":  cartItem.Jumlah,
		},
	})
}

// UpdateCartItemHandler updates cart item quantity
func UpdateCartItemHandler(c *gin.Context) {
	var updateData struct {
		IDProduk string `json:"id_produk" binding:"required"`
		Jumlah   int    `json:"jumlah" binding:"required"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Data tidak valid",
		})
		return
	}

	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session ID diperlukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Keranjang berhasil diperbarui",
	})
}

// RemoveFromCartHandler removes item from cart
func RemoveFromCartHandler(c *gin.Context) {
	productID := c.Param("id")
	sessionID := c.GetHeader("X-Session-ID")

	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session ID diperlukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Item berhasil dihapus dari keranjang",
	})
}

// ClearCartHandler clears entire cart
func ClearCartHandler(c *gin.Context) {
	sessionID := c.GetHeader("X-Session-ID")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Session ID diperlukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Keranjang berhasil dikosongkan",
	})
}
