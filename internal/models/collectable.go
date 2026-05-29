package models

type Collectable struct {
	ID                 int     `db:"id"                   json:"id"`
	Item               string  `db:"item"                 json:"item"`
	Type               *string `db:"type"                 json:"type"`
	Maker              *string `db:"maker"                json:"maker"`
	PlaceOfPublication *string `db:"place_of_publication"  json:"place_of_publication"`
	Writer             *string `db:"writer"               json:"writer"`
	Date               *string `db:"date"                 json:"date"`
	CoverPrice         *string `db:"cover_price"          json:"cover_price"`
	Category           *string `db:"category"             json:"category"`
	Language           *string `db:"language"             json:"language"`
	Notes              *string `db:"notes"                json:"notes"`
	CoverType          *string `db:"cover_type"           json:"cover_type"`
	Pages              *int    `db:"pages"                json:"pages"`
	Condition          *string `db:"condition"            json:"condition"`
	Shelf              *string `db:"shelf"                json:"shelf"`
	Location           *string `db:"location"             json:"location"`
	ImageURL           *string `db:"image_url"            json:"image_url"`
}