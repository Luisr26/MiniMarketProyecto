# 🌙 La Media Luna - Sistema de Gestión de Inventario & POS

![Angular](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Ng-Zorro](https://img.shields.io/badge/NG--ZORRO-Ant%20Design-1890FF?style=for-the-badge&logo=ant-design&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind--CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**La Media Luna** es una solución integral de Punto de Venta (POS) y Gestión Administrativa diseñada para optimizar las operaciones de minimercados modernos. El sistema combina una arquitectura técnica robusta con una interfaz de usuario intuitiva y de alto rendimiento.

---

## 👥 Equipo de Desarrollo

Este proyecto ha sido desarrollado integralmente por nuestro equipo multidisciplinario, donde cada miembro participó activamente tanto en el desarrollo del **Frontend** como en la arquitectura del **Backend** y la lógica de negocio:

*   **Luis Orozco**
*   **Donny Florez**
*   **Jose Doria**
*   **Alberto Muñoz**
*   **Lina Muelle**
*   **Andres Rios**

---

## 🚀 Fases del Proyecto

### Fase 1: Arquitectura y Sistema de Diseño
En esta fase inicial, establecimos los cimientos del sistema utilizando **Angular 20** con un enfoque de **Standalone Components**. Desarrollamos un sistema de diseño propio basado en los principios de Ant Design, garantizando una experiencia de usuario consistente, moderna y totalmente adaptativa (Responsive).

### Fase 2: Módulo POS y Lógica Transaccional
Desarrollamos el corazón del sistema: el Punto de Venta. Esta fase incluyó la implementación de motores de cálculo para impuestos (ITBIS/IVA), gestión de carritos en tiempo real, validación de stock y generación de comprobantes digitales (Tickets) con códigos de barras dinámicos integrados.

### Fase 3: Gestión Administrativa e Inventario
Implementamos módulos avanzados para el control total del negocio:
*   **Inventory Control**: Monitoreo de niveles de stock con alertas críticas.
*   **Suppliers Management**: Directorio centralizado de proveedores con métricas de órdenes.
*   **History & Auditing**: Registro completo de cada transacción realizada para análisis financiero.
*   **Users Management**: Gestión centralizada de colaboradores y permisos.

### Fase 4: Seguridad y Sincronización de Datos
Finalizamos con la integración de seguridad y persistencia:
*   **RBAC (Role-Based Access Control)**: Implementación de perfiles diferenciados (Admin, Bodeguero, Cajero) con acceso restringido por roles.
*   **Data Hub**: Establecimiento de un núcleo de persistencia centralizado que garantiza la integridad de los datos en toda la aplicación, permitiendo una sincronización en tiempo real entre el almacén y el punto de venta.

---

## 🛠️ Stack Tecnológico

*   **Core**: Angular 20+, RxJS, TypeScript.
*   **UI/UX**: NG-ZORRO (Ant Design), Tailwind CSS, GSAP (Animaciones).
*   **Utilidades**: JsBarcode para tickets, Lucide Icons.
*   **Arquitectura**: Componentes Standalone, Servicios de Estado Centralizados.

---

## 📋 Requisitos e Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Luisr26/MiniMarketProyecto.git
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Ejecutar en modo desarrollo:**
    ```bash
    npm start
    ```

---

*Desarrollado con ❤️ por el equipo de La Media Luna.*
