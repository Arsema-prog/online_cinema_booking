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

import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;
import org.springframework.util.StringUtils;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucketName;

    @Value("${minio.assets-bucket:cinema-assets}")
    private String assetsBucket;

    @Value("${minio.external-endpoint:http://localhost:9000}")
    private String externalEndpoint;

    @PostConstruct
    public void createBucketIfNotExists() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            System.out.println("Created bucket: " + bucketName);
        }

        boolean assetsExists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(assetsBucket).build());
        if (!assetsExists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(assetsBucket).build());
            System.out.println("Created bucket: " + assetsBucket);

            // Set bucket policy to public read
            String policy = "{\n" +
                    "  \"Version\": \"2012-10-17\",\n" +
                    "  \"Statement\": [\n" +
                    "    {\n" +
                    "      \"Action\": [\"s3:GetObject\"],\n" +
                    "      \"Effect\": \"Allow\",\n" +
                    "      \"Principal\": \"*\",\n" +
                    "      \"Resource\": [\"arn:aws:s3:::" + assetsBucket + "/*\"]\n" +
                    "    }\n" +
                    "  ]\n" +
                    "}";

            minioClient.setBucketPolicy(SetBucketPolicyArgs.builder()
                    .bucket(assetsBucket)
                    .config(policy)
                    .build());
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

    /**
     * Upload an image file to the public assets bucket and return the public URL.
     */
    public String uploadFile(MultipartFile file, String folder) {
        try {
            String originalFileName = file.getOriginalFilename();
            String extension = StringUtils.getFilenameExtension(originalFileName);
            String objectKey = folder + "/" + UUID.randomUUID().toString() + (extension != null ? "." + extension : "");

            try (InputStream is = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(assetsBucket)
                                .object(objectKey)
                                .stream(is, file.getSize(), -1)
                                .contentType(file.getContentType())
                                .build()
                );
            }

            return externalEndpoint + "/" + assetsBucket + "/" + objectKey;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to MinIO", e);
        }
    }
}