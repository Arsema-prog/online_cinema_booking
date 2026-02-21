package com.cinema.supportservice.service;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    @PostConstruct
    public void createBucketIfNotExists() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            System.out.println("Created bucket: " + bucketName);
        }
    }

    /**
     * Generate a signed GET URL for a MinIO object
     * @param objectKey the path of the object in the bucket
     * @param expiryMinutes time in minutes until the URL expires
     * @return signed URL as a String
     */
    public String getSignedUrl(String objectKey, long expiryMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry((int) TimeUnit.MINUTES.toSeconds(expiryMinutes))
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signed URL for object: " + objectKey, e);
        }
    }
}