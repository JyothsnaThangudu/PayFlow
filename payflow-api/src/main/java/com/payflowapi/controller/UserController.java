package com.payflowapi.controller;

import com.payflowapi.dto.LoginDto;
import com.payflowapi.dto.LoginResponse;
import com.payflowapi.entity.User;
import com.payflowapi.repository.UserRepository;
import com.payflowapi.service.EmailService;
import com.payflowapi.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController // Marks this as a REST API controller
@RequestMapping("/api") // Base URL path for all endpoints in this class
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // LOGIN endpoint
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginDto loginDto) {
        // Calls the login logic in the service and returns token, role, and firstLogin
        // info

        return ResponseEntity.ok(userService.login(loginDto));
    }

    // RESET PASSWORD endpoint
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        String newPassword = body.get("newPassword");
        String token = authHeader.replace("Bearer ", ""); // Extract token from header

        // Find the user by username (token holds the username here)
        Optional<User> optionalUser = userRepository.findByUsername(token);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        // Update password and mark firstLogin as false
        User user = optionalUser.get();
        user.setPassword(newPassword);
        user.setFirstLogin(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    @PostMapping("/admin/add-user")
    public ResponseEntity<?> addUser(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String role = body.get("role");

        // Check if user already exists
        if (userRepository.findByUsername(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "User with this email already exists"));
        }

        // Create and save the new user
        User user = new User();
        user.setName(name);
        user.setUsername(email);
        user.setPassword(password);
        user.setRole(role.toUpperCase());
        user.setFirstLogin(true);

        userRepository.save(user);

        // Try sending email
        try {
            System.out.println("📧 Calling emailService for: " + email);
            emailService.sendUserCredentials(email, email, password);
            System.out.println("✅ Email sent (or attempted) to: " + email);
            return ResponseEntity.ok(Map.of("message", "User added successfully and credentials emailed"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "User saved, but failed to send email"));
        }
    }

    // GET all users
    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // DISABLE user by email (username)
    @PutMapping("/admin/disable-user")
    public ResponseEntity<?> disableUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");

        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        User user = optionalUser.get();
        user.setActive(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User disabled successfully"));
    }

    // ENABLE user by email (username)
    @PutMapping("/admin/enable-user")
    public ResponseEntity<?> enableUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");

        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        User user = optionalUser.get();
        user.setActive(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User enabled successfully"));
    }

    // UPDATE user details
    @PutMapping("/admin/users/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username, @RequestBody Map<String, String> body) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        User user = optionalUser.get();

        // Update fields if provided
        if (body.containsKey("name")) {
            user.setName(body.get("name"));
        }
        if (body.containsKey("email")) {
            // Check if new email already exists (and it's not the current user)
            String newEmail = body.get("email");
            if (!newEmail.equals(user.getUsername())) {
                if (userRepository.findByUsername(newEmail).isPresent()) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "Email already exists"));
                }
                user.setUsername(newEmail);
            }
        }
        if (body.containsKey("role")) {
            user.setRole(body.get("role").toUpperCase());
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User updated successfully"));
    }

    // DELETE user
    @DeleteMapping("/admin/users/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        Optional<User> optionalUser = userRepository.findByUsername(username);
        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        userRepository.delete(optionalUser.get());
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @GetMapping("/test")
    public String testApi() {
        return "✅ Controller is working!";
    }

}