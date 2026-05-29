package models

type Comic struct {
	ID                 int      `db:"id"                   json:"id"`
	Title              string   `db:"title"                json:"title"`
	Number             *string  `db:"number"               json:"number"`
	Publisher          *string  `db:"publisher"            json:"publisher"`
	PlaceOfPublication *string  `db:"place_of_publication"  json:"place_of_publication"`
	Writer             *string  `db:"writer"               json:"writer"`
	Date               *string  `db:"date"                 json:"date"`
	CoverPrice         *float64 `db:"cover_price"          json:"cover_price"`
	Category           *string  `db:"category"             json:"category"`
	Language           *string  `db:"language"             json:"language"`
	Notes              *string  `db:"notes"                json:"notes"`
	Condition          *string  `db:"condition"            json:"condition"`
	Pages              *int     `db:"pages"                json:"pages"`
	OnlineCGC          *string  `db:"online_cgc"           json:"online_cgc"`
	OnlinePrice        *float64 `db:"online_price"         json:"online_price"`
	ValueBasedOn       *string  `db:"value_based_on"       json:"value_based_on"`
	Owner              *string  `db:"owner"                json:"owner"`
	Tags               *string  `db:"tags"                 json:"tags"`
	ImageURL           *string  `db:"image_url"            json:"image_url"`
}