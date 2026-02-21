package com.cinema.supportservice.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucketName;

    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

//    @PostConstruct
//    public void init() {
//        try {
//            MinioClient client = minioClient();
//            boolean bucketExists = client.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
//            if (!bucketExists) {
//                client.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
//                System.out.println("Created MinIO bucket: " + bucketName);
//            } else {
//                System.out.println("MinIO bucket already exists: " + bucketName);
//            }
//        } catch (Exception e) {
//            throw new RuntimeException("Failed to initialize MinIO bucket: " + bucketName, e);
//        }
//    }
}