package com.cinema.coreservice.service;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.net.URLConnection;
import java.util.concurrent.TimeUnit;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import jakarta.annotation.PostConstruct;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    @Value("${minio.public-endpoint:${minio.endpoint}}")
    private String publicEndpoint;

    @Value("${minio.endpoint:http://localhost:9000}")
    private String internalEndpoint;

    @PostConstruct
    public void init() {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }
        } catch (Exception e) {
            log.error("Failed to initialize bucket", e);
        }
    }

    public String uploadMoviePoster(Long movieId, MultipartFile file) {
        try {
            String bucketName = "posters";
            String objectName = String.format("movie_%d.jpg", movieId);

            log.info("Uploading to MinIO - bucket: {}, object: {}, file size: {} bytes, content type: {}",
                    bucketName, objectName, file.getSize(), file.getContentType());

            // Check if bucket exists
            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );

            if (!bucketExists) {
                log.info("Creating bucket: {}", bucketName);
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );
            }

            // IMPORTANT: Use putObject correctly - this creates a FILE, not a directory
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)  // This should be the full path including filename
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Successfully uploaded file: {}/{}", bucketName, objectName);
            return objectName;

        } catch (Exception e) {
            log.error("MinIO upload failed for movie {}: {}", movieId, e.getMessage(), e);
            throw new RuntimeException("Failed to upload poster to MinIO", e);
        }
    }
//    public String uploadMoviePoster(Long movieId, MultipartFile file) {
//        try {
//            String objectKey = buildMoviePosterObjectKey(movieId);
//            minioClient.putObject(
//                    PutObjectArgs.builder()
//                            .bucket(bucketName)
//                            .object(objectKey)
//                            .stream(file.getInputStream(), file.getSize(), -1)
//                            .contentType(file.getContentType() != null ? file.getContentType() : "image/jpeg")
//                            .build()
//            );
//            return objectKey;
//        } catch (Exception e) {
//            log.error("Failed to upload movie poster to Minio", e);
//            throw new RuntimeException("Failed to upload movie poster to Minio");
//        }
//    }

    public String buildMoviePosterObjectKey(Long movieId) {
        return "movie_" + movieId + ".jpg";
    }

    public InputStream getObject(String objectKey) {
        try {
            return minioClient.getObject(
                    io.minio.GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to get object from Minio: {}", objectKey, e);
            return null;
        }
    }

    public String fetchAndUploadImage(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) return null;
        if (!imageUrl.startsWith("http")) return imageUrl; // Assume it's already uploaded or a path

        try {
            URL url = java.net.URI.create(imageUrl).toURL();
            URLConnection conn = url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            try (InputStream in = conn.getInputStream()) {
                String extension = ".jpg";
                if (imageUrl.toLowerCase().contains(".png")) extension = ".png";
                String objectKey = "posters/" + UUID.randomUUID() + extension;

                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .stream(in, -1, 10485760) // Stream size -1 means unknown, max part 10MB
                                .contentType(conn.getContentType() != null ? conn.getContentType() : "image/jpeg")
                                .build()
                );
                
                // Return presigned URL valid for 7 days
                return getSignedUrl(objectKey, 7);
            }
        } catch (Exception e) {
            log.error("Failed to fetch and upload image from " + imageUrl, e);
            return imageUrl; // Fallback to original
        }
    }

    public InputStream getMoviePoster(Long movieId) {
        String[] candidateKeys = new String[] {
                "movie_" + movieId + ".jpg",
                "posters/movie_" + movieId + ".jpg"
        };

        for (String objectKey : candidateKeys) {
            try {
                return minioClient.getObject(
                        io.minio.GetObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .build()
                );
            } catch (Exception ignored) {
                // Try next candidate key
            }
        }

        log.error("Failed to get movie poster for id: {}. Tried keys: {}", movieId, String.join(", ", candidateKeys));
        return null;
    }

    public String getSignedUrl(String objectKey, int days) {
        try {
            String signedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(days, TimeUnit.DAYS)
                            .build()
            );
            return rewriteToPublicEndpoint(signedUrl);
        } catch (Exception e) {
            log.error("Cannot generate signed URL for " + objectKey, e);
            return null;
        }
    }

    public String toPublicObjectUrl(String reference) {
        if (reference == null || reference.isBlank()) {
            return reference;
        }

        String normalized = normalizePosterReference(reference);
        if (normalized == null || normalized.isBlank()) {
            return reference;
        }

        if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            return normalized;
        }

        String base = (publicEndpoint == null || publicEndpoint.isBlank() ? internalEndpoint : publicEndpoint)
                .replaceAll("/+$", "");
        String bucketPath = bucketName != null && !bucketName.isBlank() ? "/" + bucketName : "";
        return base + bucketPath + "/" + normalized.replaceFirst("^/+", "");
    }

    public String normalizePosterReference(String reference) {
        if (reference == null) {
            return null;
        }

        String trimmed = reference.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            try {
                URI uri = URI.create(trimmed);
                if (isManagedBucketUrl(uri)) {
                    return extractObjectKeyFromPath(uri.getPath());
                }
            } catch (Exception ignored) {
                // Fall through and return the original value for non-MinIO URLs.
            }
            return trimmed;
        }

        return extractObjectKeyFromPath(trimmed);
    }

    public boolean isManagedPosterReference(String reference) {
        if (reference == null || reference.isBlank()) {
            return false;
        }
        String normalized = normalizePosterReference(reference);
        return normalized != null
                && !normalized.startsWith("http://")
                && !normalized.startsWith("https://");
    }

    private boolean isManagedBucketUrl(URI candidate) {
        return matchesBaseUri(candidate, internalEndpoint) || matchesBaseUri(candidate, publicEndpoint);
    }

    private boolean matchesBaseUri(URI candidate, String configuredBase) {
        if (configuredBase == null || configuredBase.isBlank()) {
            return false;
        }

        try {
            URI configured = URI.create(configuredBase);
            int candidatePort = candidate.getPort() == -1 ? defaultPort(candidate.getScheme()) : candidate.getPort();
            int configuredPort = configured.getPort() == -1 ? defaultPort(configured.getScheme()) : configured.getPort();
            return safeEquals(candidate.getScheme(), configured.getScheme())
                    && safeEquals(candidate.getHost(), configured.getHost())
                    && candidatePort == configuredPort;
        } catch (Exception ignored) {
            return false;
        }
    }

    private int defaultPort(String scheme) {
        if ("https".equalsIgnoreCase(scheme)) {
            return 443;
        }
        return 80;
    }

    private boolean safeEquals(String left, String right) {
        return left != null && right != null && left.equalsIgnoreCase(right);
    }

    private String extractObjectKeyFromPath(String rawPath) {
        if (rawPath == null) {
            return null;
        }

        String normalized = rawPath.trim().replaceFirst("^/+", "");
        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.startsWith(bucketName + "/")) {
            normalized = normalized.substring((bucketName + "/").length());
        }

        if (normalized.startsWith(bucketName + "/")) {
            normalized = normalized.substring((bucketName + "/").length());
        }

        return normalized;
    }

    private String rewriteToPublicEndpoint(String signedUrl) {
        if (signedUrl == null || signedUrl.isBlank() || publicEndpoint == null || publicEndpoint.isBlank()) {
            return signedUrl;
        }

        try {
            URI source = URI.create(signedUrl);
            URI targetBase = URI.create(publicEndpoint);
            URI rewritten = new URI(
                    targetBase.getScheme(),
                    source.getUserInfo(),
                    targetBase.getHost(),
                    targetBase.getPort(),
                    source.getPath(),
                    source.getQuery(),
                    source.getFragment()
            );
            return rewritten.toString();
        } catch (Exception e) {
            log.warn("Failed to rewrite signed URL to public endpoint. Using original URL.");
            return signedUrl;
        }
    }
}
