package com.cinema.booking_service.service;

import com.cinema.booking_service.domain.Booking;
import com.cinema.booking_service.dto.HistorySeatDto;
import com.cinema.booking_service.dto.UserHistoryBookingDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.Result;
import io.minio.messages.Item;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserHistoryStorageService {

    private final MinioClient minioClient;
    private final ObjectMapper objectMapper;

    @Value("${minio.user-history-bucket:user-history}")
    private String userHistoryBucket;

    @PostConstruct
    public void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(userHistoryBucket).build());
        if (!exists) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(userHistoryBucket).build());
            log.info("Created MinIO bucket: {}", userHistoryBucket);
        } else {
            log.info("MinIO bucket already exists: {}", userHistoryBucket);
        }
    }

    public void saveConfirmedBooking(Booking booking, List<String> seatNumbers) {
        try {
            if (booking == null || booking.getId() == null || booking.getUserId() == null) {
                log.warn("Skipping booking history persistence due to missing booking data");
                return;
            }

            UserHistoryBookingDto payload = UserHistoryBookingDto.builder()
                    .id(booking.getId())
                    .userId(booking.getUserId())
                    .movieTitle(booking.getMovieTitle())
                    .cinemaName(booking.getBranchName())
                    .screenNumber(booking.getScreenName())
                    .showTime(booking.getShowTime())
                    .seats((seatNumbers == null ? List.<String>of() : seatNumbers).stream()
                            .map(seat -> HistorySeatDto.builder().seatNumber(seat).build())
                            .collect(Collectors.toList()))
                    .seatCount(seatNumbers == null ? 0 : seatNumbers.size())
                    .snackDetails(booking.getSnackDetails())
                    .snacksTotal(booking.getSnacksTotal())
                    .totalAmount(booking.getTotalAmount())
                    .status(booking.getStatus() != null ? booking.getStatus().name() : "UNKNOWN")
                    .createdAt(booking.getCreatedAt())
                    .build();

            String objectKey = booking.getUserId() + "/" + booking.getId() + ".json";
            String json = objectMapper.writeValueAsString(payload);
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(userHistoryBucket)
                            .object(objectKey)
                            .stream(new ByteArrayInputStream(bytes), bytes.length, -1)
                            .contentType("application/json")
                            .build()
            );
            log.info("Persisted booking {} into MinIO history for user {}", booking.getId(), booking.getUserId());
        } catch (Exception e) {
            log.error("Failed to persist booking history to MinIO for booking {}", booking != null ? booking.getId() : null, e);
        }
    }

    public List<UserHistoryBookingDto> getUserBookings(UUID userId) {
        if (userId == null) {
            return List.of();
        }

        List<UserHistoryBookingDto> history = new ArrayList<>();
        String prefix = userId + "/";

        try {
            Iterable<Result<Item>> results = minioClient.listObjects(
                    io.minio.ListObjectsArgs.builder()
                            .bucket(userHistoryBucket)
                            .prefix(prefix)
                            .recursive(true)
                            .build()
            );

            for (Result<Item> result : results) {
                Item item = result.get();
                try (InputStream stream = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(userHistoryBucket)
                                .object(item.objectName())
                                .build()
                )) {
                    UserHistoryBookingDto dto = objectMapper.readValue(stream, UserHistoryBookingDto.class);
                    history.add(dto);
                }
            }

            history.sort(Comparator.comparing(UserHistoryBookingDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
            return history;
        } catch (Exception e) {
            log.error("Failed to load booking history from MinIO for user {}", userId, e);
            return List.of();
        }
    }
}
