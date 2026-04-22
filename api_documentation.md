# Documentación de la API (Minimarket POST)

Todas las respuestas exitosas y de error respetan el siguiente formato estándar global:

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje opcional"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Razón del error",
  "errors": [] // Opcional (errores de validación de Zod)
}
```

---

## 🔐 1. Auth 

### **Login**
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Auth**: No requiere.
- **Body Request**:
  ```json
  {
    "correo": "admin@medialuna.com",
    "contrasena": "admin1234"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": 1, "nombre_completo": "Admin...", "role": "..." },
      "token": "eyJhb..."
    },
    "message": "Login exitoso"
  }
  ```

---

## 📦 2. Productos

### **Crear Producto**
- **URL**: `/api/v1/products`
- **Method**: `POST`
- **Auth**: Requiere Token (Role: `ADMIN`)
- **Body Request**:
  ```json
  {
    "nombre": "Agua Mineral sin gas 1L",
    "sku": "AGU-001",
    "precio_venta": 1200,
    "stock_minimo": 10,
    "categoria_id": 1,
    "proveedor_id": 1
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": { "id": 2, "nombre": "...", "sku": "..." },
    "message": "Producto creado exitosamente"
  }
  ```

*(De igual forma operan `GET /api/v1/products`, `GET /products/:id`, `PUT /products/:id` y `DELETE /products/:id`)*

---

## 👥 3. Usuarios

*(Todas las rutas requieren Role: `ADMIN`)*

### **Crear Usuario**
- **URL**: `/api/v1/users`
- **Method**: `POST`
- **Body Request**:
  ```json
  {
    "nombre_completo": "Juan Perez",
    "correo": "juan@medialuna.com",
    "contrasena": "supersecreta",
    "role_id": 2 // ID perteneciente al CAJERO
  }
  ```

### **Eliminar (Soft Delete) Usuario**
- **URL**: `/api/v1/users/:id`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Usuario eliminado lógicamente (inactivado)"
  }
  ```

---

## 🛒 4. Ventas (POS)

### **Crear Venta (Registrar Compra y Descontar)**
- **URL**: `/api/v1/sales`
- **Method**: `POST`
- **Auth**: Requiere Token (Role: `ADMIN` o `CAJERO`)
- **Body Request**:
  ```json
  {
    "turno_id": 1,
    "items": [
      { "producto_id": 1, "cantidad": 2 },
      { "producto_id": 3, "cantidad": 1 }
    ],
    "metodo_pago": "EFECTIVO",
    "descuento_total": 500
  }
  ```
- **Posibles Errores (400)**:
  `{ "success": false, "message": "Stock insuficiente para el producto X. Disponible: Y" }`

---

## 🚚 5. Inventario

### **Registrar Entrada a Bodega (Sumar Stock)**
- **URL**: `/api/v1/inventory/entry`
- **Method**: `POST`
- **Auth**: Requiere Token (Role: `ADMIN` o `BODEGUERO`)
- **Body Request**:
  ```json
  {
    "proveedor_id": 1,
    "items": [
      {
        "producto_id": 1,
        "cantidad": 50,
        "costo_unitario": 2000
      }
    ]
  }
  ```

---

## 📊 6. Dashboard y Reportes

- **Dashboard Admin** (`GET /api/v1/dashboard/admin`): Obtiene data genérica (ingresos y recuentos del dia de hoy, productos de bajo stock).
- **Ventas por Tiempo** (`GET /api/v1/reports/sales-by-date?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`): Obtiene array agrupado.
- **Top Productos** (`GET /api/v1/reports/top-products?limit=5`): Devuelve los artículos que mas se han vendido (mayor valor en cantidad saliente).
