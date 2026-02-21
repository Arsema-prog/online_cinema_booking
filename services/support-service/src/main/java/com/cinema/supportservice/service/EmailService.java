package com.cinema.supportservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendTicketEmails(String toEmail, List<String> ticketUrls) {
        StringBuilder body = new StringBuilder("Your tickets are ready!\n\nDownload your tickets using the links below:\n");

        for (String url : ticketUrls) {
            body.append(url).append("\n");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your Cinema Tickets");
        message.setText(body.toString());

        mailSender.send(message);
    }
}