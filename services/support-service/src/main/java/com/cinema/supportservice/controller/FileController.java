package com.cinema.supportservice.controller;

import com.cinema.supportservice.service.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping({"/files", "/support/files"})
@RequiredArgsConstructor
public class FileController {

    private final MinioService minioService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false, defaultValue = "images") String folder) {
        
        String url = minioService.uploadFile(file, folder);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
