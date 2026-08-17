package com.vetapp.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
public class Users {
    @Id
//    @GeneratedValue
//    @UuidGenerator
//    @JdbcTypeCode(SqlTypes.UUID)
    private UUID id;

    @Column(name = "name", unique = false, nullable = false)
    private String name;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "phone", unique = true, nullable = false) /*ADAUGA NULLABLE FALSE CAND INREGISTREZI DIN FRONTEND*/
    private String phone;

    @Column(name = "address", nullable = false) /*ADAUGA NULLABLE FALSE CAND INREGISTREZI DIN FRONTEND*/
    private String address;

    public Users() {
    }

    public Users(UUID id, String name, String email, String phone, String address) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }


}
