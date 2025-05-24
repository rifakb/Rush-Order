package main

import (
	"RushOrder/config"
	"RushOrder/controller"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.InitDB()

	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Serve static files
	r.Static("/static", "./static")
	r.Static("/uploads", "./uploads")

	// API routes
	api := r.Group("/api")
	{
		// Admin routes
		admin := api.Group("/admin")
		{
			admin.POST("/login", controller.AdminLoginHandler)
			admin.GET("/dashboard", controller.GetDashboardStatsHandler)
			admin.GET("/orders", controller.GetAllOrdersHandler)
			admin.GET("/orders/:id", controller.GetOrderDetailHandler)
			admin.PUT("/orders/:id/complete", controller.CompleteOrderHandler)
			admin.DELETE("/orders/:id", controller.DeleteOrderHandler)
		}

		// Customer routes
		customer := api.Group("/customer")
		{
			customer.POST("/login", controller.CustomerLoginHandler)
			customer.GET("/session", controller.GetCustomerSessionHandler)
			customer.POST("/logout", controller.LogoutHandler)
		}

		// Product routes
		products := api.Group("/products")
		{
			products.GET("/", controller.GetAllProductsHandler)
			products.GET("/:id", controller.GetProductHandler)
			products.POST("/", controller.CreateProductHandler)
			products.PUT("/:id", controller.UpdateProductHandler)
			products.DELETE("/:id", controller.DeleteProductHandler)
		}

		// Order routes
		orders := api.Group("/orders")
		{
			orders.POST("/", controller.CreateOrderHandler)
			orders.GET("/customer", controller.GetCustomerOrdersHandler)
			orders.GET("/:id", controller.GetOrderHandler)
		}

		// Cart routes
		cart := api.Group("/cart")
		{
			cart.GET("/", controller.GetCartHandler)
			cart.POST("/add", controller.AddToCartHandler)
			cart.PUT("/update", controller.UpdateCartItemHandler)
			cart.DELETE("/remove/:id", controller.RemoveFromCartHandler)
			cart.DELETE("/clear", controller.ClearCartHandler)
		}
	}

	r.Run(":8080")
}
