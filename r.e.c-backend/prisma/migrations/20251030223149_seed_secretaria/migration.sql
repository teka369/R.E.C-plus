-- Seed initial SECRETARIA user to enable admin operations
INSERT INTO "User" (nombres, apellidos, email, documento_identidad, telefono, password, role, "createdAt", "updatedAt")
VALUES ('Sec', 'Retaria', 'secretaria@iejavieralondonobarriosevilla.edu.co', '99999999', NULL, 'admin12345', 'SECRETARIA', NOW(), NOW());