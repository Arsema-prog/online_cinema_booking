package com.cinema.coreservice.controller;

import com.cinema.coreservice.model.Branch;
import com.cinema.coreservice.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;

@RestController
@RequestMapping("/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        List<Branch> branches = branchRepository.findAll();
        return ResponseEntity.ok(branches);
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Branch> getBranchById(@PathVariable Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with id: " + id));
        return ResponseEntity.ok(branch);
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch) {
        Branch savedBranch = branchRepository.save(branch);
        return new ResponseEntity<>(savedBranch, HttpStatus.CREATED);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id,
                                               @RequestBody Branch branchDetails) {

        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with id: " + id));

        branch.setName(branchDetails.getName());
        branch.setAddress(branchDetails.getAddress());
        Branch updatedBranch = branchRepository.save(branch);
        return ResponseEntity.ok(updatedBranch);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {

        if (!branchRepository.existsById(id)) {
            throw new EntityNotFoundException("Branch not found with id: " + id);
        }

        branchRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
