# API Documentation

## Image Upload

### Upload Image
**Endpoint**: `POST /api/upload`
**Authentication**: Required (Session)

**Request**:
- `Content-Type`: `multipart/form-data`
- `file`: The image file (JPG, PNG, GIF, WEBP). Max 5MB.

**Response (Success)**:
```json
{
  "url": "/api/uploads/unique-filename.png"
}
```

**Response (Error)**:
```json
{
  "error": "Error message"
}
```

### Retrieve Image
**Endpoint**: `GET /api/uploads/[filename]`
**Authentication**: Public (served as static asset with caching)

**Response**:
- Returns the image file with caching headers (`Cache-Control: public, max-age=31536000, immutable`).
