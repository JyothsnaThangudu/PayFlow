package com.payflowapi.service;

import com.payflowapi.entity.Announcement;
import com.payflowapi.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnnouncementService {
    @Autowired
    private AnnouncementRepository announcementRepository;

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByCreatedAtDesc();
    }

    public Announcement addAnnouncement(Announcement announcement) {
        return announcementRepository.save(announcement);
    }
}
