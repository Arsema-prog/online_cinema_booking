package com.cinema.supportservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendTicketEmails(String toEmail, List<String> ticketUrls) {
        StringBuilder body = new StringBuilder("Your booking was successful.\n\n");
        if (ticketUrls != null && !ticketUrls.isEmpty()) {
            body.append("Download your tickets using the links below:\n");
            for (String url : ticketUrls) {
                body.append(url).append("\n");
            }
        } else {
            body.append("Your ticket details are being prepared. Please open My Booking History in the app to access your latest ticket details.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Your Cinema Tickets");
        message.setText(body.toString());

        log.info("Sending ticket email to {}", toEmail);
        mailSender.send(message);
    }
}
