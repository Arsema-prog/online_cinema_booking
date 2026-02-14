package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Branch;
import com.cinema.coreservice.repository.BranchRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Branch not found: " + id));
    }

    public Branch createBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch branchDetails) {
        Branch branch = getBranchById(id);
        branch.setName(branchDetails.getName());
        branch.setAddress(branchDetails.getAddress());
        return branchRepository.save(branch);
    }

    public void deleteBranch(Long id) {
        if (!branchRepository.existsById(id)) {
            throw new EntityNotFoundException("Branch not found: " + id);
        }
        branchRepository.deleteById(id);
    }
}
