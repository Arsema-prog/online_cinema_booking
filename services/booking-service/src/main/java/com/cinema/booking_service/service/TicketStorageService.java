package com.cinema.booking_service.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketStorageService {

    private final MinioClient minioClient;

    @Value("${minio.tickets-bucket:tickets}")
    private String ticketsBucket;

    @PostConstruct
    public void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(ticketsBucket).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(ticketsBucket).build());
            log.info("Created MinIO bucket: {}", ticketsBucket);
        } else {
            log.info("MinIO bucket already exists: {}", ticketsBucket);
        }
    }

    public String uploadTicket(UUID bookingId, MultipartFile file) {
        if (bookingId == null || file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Booking ID and file must not be null or empty");
        }

        try {
            String objectKey = bookingId.toString() + "/ticket.pdf";
            
            try (InputStream stream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(ticketsBucket)
                                .object(objectKey)
                                .stream(stream, file.getSize(), -1)
                                .contentType("application/pdf")
                                .build()
                );
            }
            log.info("Successfully uploaded ticket to MinIO for booking {}", bookingId);
            return objectKey;
        } catch (Exception e) {
            log.error("Failed to upload ticket to MinIO for booking {}", bookingId, e);
            throw new RuntimeException("Failed to upload ticket file", e);
        }
    }
}
