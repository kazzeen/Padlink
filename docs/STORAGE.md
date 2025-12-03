# File Storage Configuration

## Current Setup (Local Development)
- **Location**: Files are stored locally in the `public/uploads` directory.
- **Serving**: Files are served via the custom API route `/api/uploads/[filename]` to ensure proper caching headers (`Cache-Control: public, max-age=31536000, immutable`).
- **Database**: The User `avatar` field stores the relative URL path (e.g., `/api/uploads/uuid-filename.png`).

## Production Recommendations
For a production environment, it is highly recommended to switch to a cloud storage provider like AWS S3, Google Cloud Storage, or Vercel Blob to ensure scalability and persistence across deployments.

### Migration Steps to Cloud Storage (e.g., AWS S3):

1. **Install SDK**: 
   ```bash
   npm install @aws-sdk/client-s3
   ```

2. **Configure Environment Variables**:
   Add the following to your `.env` file:
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_BUCKET_NAME=your_bucket_name
   ```

3. **Update Upload Logic (`app/api/upload/route.ts`)**:
   - Replace the `fs/promises` file writing logic with the S3 `PutObjectCommand`.
   - Ensure the file ACL is set to public-read or generate a signed URL if private.

4. **Update Image Configuration (`next.config.ts`)**:
   - Add the S3 bucket domain to `images.remotePatterns` to allow Next.js Image component to optimize images from that domain.

   ```typescript
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: 'your-bucket.s3.amazonaws.com',
         port: '',
         pathname: '/**',
       },
     ],
   },
   ```
