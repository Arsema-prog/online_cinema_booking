package com.cinema.coreservice.service;

import com.cinema.coreservice.model.Tag;
import com.cinema.coreservice.repository.TagRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagService {

    private final TagRepository tagRepository;

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    public Tag createTag(Tag tag) {
        if (tag.getGenre() == null || tag.getGenre().trim().isEmpty()) {
            throw new IllegalArgumentException("Tag name cannot be empty");
        }
        if (tagRepository.existsByGenreIgnoreCase(tag.getGenre().trim())) {
            throw new IllegalArgumentException("A tag with this name already exists");
        }
        tag.setGenre(tag.getGenre().trim());
        log.info("Creating new tag: {}", tag.getGenre());
        return tagRepository.save(tag);
    }

    public void deleteTag(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tag not found with ID: " + id));

        if (tag.getMovies() != null && !tag.getMovies().isEmpty()) {
            throw new IllegalStateException("Cannot delete tag '" + tag.getGenre() + "'. It is currently linked to " + tag.getMovies().size() + " feature(s).");
        }

        log.info("Deleting tag: {}", tag.getGenre());
        tagRepository.deleteById(id);
    }
}
