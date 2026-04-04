package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Snack;
import com.cinema.coreservice.repository.SnackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SnackService {

    private final SnackRepository snackRepository;

    public List<Snack> getAllSnacks() {
        return snackRepository.findAll();
    }

    public List<Snack> getAvailableSnacks() {
        return snackRepository.findByAvailableTrue();
    }

    public Snack getSnackById(Long id) {
        return snackRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Snack not found with id: " + id));
    }

    public Snack createSnack(Snack snack) {
        return snackRepository.save(snack);
    }

    public Snack updateSnack(Long id, Snack updatedSnack) {
        Snack snack = getSnackById(id);
        snack.setName(updatedSnack.getName());
        snack.setDescription(updatedSnack.getDescription());
        snack.setCategory(updatedSnack.getCategory());
        snack.setPrice(updatedSnack.getPrice());
        snack.setStockQuantity(updatedSnack.getStockQuantity());
        snack.setAvailable(updatedSnack.isAvailable());
        snack.setImageUrl(updatedSnack.getImageUrl());
        return snackRepository.save(snack);
    }

    public void deleteSnack(Long id) {
        snackRepository.deleteById(id);
    }
}
