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
import java.net.URL;
import java.net.URLConnection;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    public String fetchAndUploadImage(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) return null;
        if (!imageUrl.startsWith("http")) return imageUrl; // Assume it's already uploaded or a path

        try {
            URL url = new URL(imageUrl);
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

    public String getSignedUrl(String objectKey, int days) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(days, TimeUnit.DAYS)
                            .build()
            );
        } catch (Exception e) {
            log.error("Cannot generate signed URL for " + objectKey, e);
            return null;
        }
    }
}
