package com.tokomanajemen.modules.pos;

import com.tokomanajemen.common.ApiResponse;
import com.tokomanajemen.modules.pos.model.Customer;
import com.tokomanajemen.modules.pos.repository.CustomerRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> getCustomerById(@PathVariable String id) {
        return customerRepository.findById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.ok("Data pelanggan ditemukan", c)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Pelanggan tidak ditemukan")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Customer>> createCustomer(@Valid @RequestBody Customer customer) {
        if (customer.getId() == null || customer.getId().isBlank()) {
            customer.setId("CUST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        customer.setCreatedAt(Instant.now());
        customer.setUpdatedAt(Instant.now());
        Customer saved = customerRepository.save(customer);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Pelanggan berhasil ditambahkan", saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Customer>> updateCustomer(@PathVariable String id,
                                                                 @Valid @RequestBody Customer payload) {
        return customerRepository.findById(id)
                .map(existing -> {
                    existing.setName(payload.getName());
                    existing.setPhone(payload.getPhone());
                    existing.setAddress(payload.getAddress());
                    if (payload.getCreditLimit() != null) {
                        existing.setCreditLimit(payload.getCreditLimit());
                    }
                    existing.setUpdatedAt(Instant.now());
                    Customer saved = customerRepository.save(existing);
                    return ResponseEntity.ok(ApiResponse.ok("Pelanggan berhasil diperbarui", saved));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Pelanggan tidak ditemukan")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable String id) {
        if (!customerRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Pelanggan tidak ditemukan"));
        }
        customerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Pelanggan berhasil dihapus", null));
    }
}
