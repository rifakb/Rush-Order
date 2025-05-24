package models

import "time"

type Order struct {
	IDOrder     string     `gorm:"column:id_order;primaryKey;size:20" json:"id_order"`
	IDPemesan   string     `gorm:"column:id_pemesan;size:20" json:"id_pemesan"`
	TotalHarga  int        `gorm:"column:total_harga;default:0" json:"total_harga"`
	Status      string     `gorm:"column:status;default:pending" json:"status"`
	CreatedAt   time.Time  `gorm:"column:created_at" json:"created_at"`
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`

	// Relations
	Customer Pemesan     `gorm:"foreignKey:IDPemesan;references:IDPemesan" json:"customer,omitempty"`
	Items    []OrderItem `gorm:"foreignKey:IDOrder;references:IDOrder" json:"items,omitempty"`
}
