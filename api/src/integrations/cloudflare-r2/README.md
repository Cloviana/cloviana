# Product image storage setup

Set `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_PUBLIC_BASE_URL` in the API environment. The public base URL must point to the R2 bucket's public delivery domain; the S3 API endpoint is not a delivery URL. Use an R2 custom domain for production. Existing Supabase image URLs remain valid independently of this setting.

Configure the bucket before using uploads:

- Allow browser `PUT` requests from each app origin in the R2 CORS policy, including the `Content-Type` header. The browser sends uploads to the R2 S3 endpoint, not the public delivery domain.
- Add an object lifecycle expiration rule for `temporary/media-library/` (for example, one day). Completed library uploads are copied to `media/`; never expire that permanent prefix. Keep an expiration rule for the legacy `temporary/product-media/` prefix while abandoned uploads from the old product flow remain there.
- Ensure the delivery domain can serve the bucket's `product-media/` and `media/` objects and configure caching as appropriate. Connecting a public bucket domain also exposes temporary objects by their URLs: use a separate private staging bucket or protected delivery layer if unpublished uploads must be private.

The API checks the stored size, content type and detected file signature before copying an upload to a new permanent key. Signed uploads expire after five minutes; the conditional copy prevents changing the temporary object between inspection and promotion. The library also accepts MP4 and WebM videos up to 50 MB without transcoding or thumbnails. Only formats recognized by `file-type` and matching the supplied MIME type are accepted; SVG is not supported.

Promotion and the database write are separate operations, so interrupted uploads can leave unreferenced permanent objects. Removing an image from a product retains the reusable file in the library. Do not apply a blanket expiration rule to permanent objects.
