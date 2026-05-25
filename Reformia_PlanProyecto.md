# Reformia — Plan de Proyecto

> Conversación de planificación completa del proyecto

---

## 1. Concepto inicial

App multiplataforma compuesta por un agente de IA para profesionales de reformas y obras. El objetivo es que el profesional hable con el agente para pedirle un presupuesto de lo que costaría realizar una obra o reforma con las características concretas que indique.

**Funcionalidades principales:**
- Agente de IA (interacción por texto)
- Apartado de presupuestos generados (envío e impresión)
- Módulo de facturas (envío e impresión)

---

## 2. Decisiones técnicas clave

### Stack tecnológico

| Capa | Tecnología | Coste |
|---|---|---|
| App | React Native + Expo | 0€ |
| Agente IA | GPT-4o (OpenAI) | Pay per use |
| Base de datos + Auth | Supabase | 0€ hasta escalar |
| Email | Resend | 0€ hasta 3.000/mes |
| PDF | react-native-html-to-pdf | 0€ |
| Hosting | Vercel | 0€ |

**Coste operativo al arrancar: prácticamente 0€/mes**, solo se paga por las llamadas a la API de GPT-4o según uso.

### Arquitectura

```
App (React Native + Expo)
    │
    ├── Chat con agente → GPT-4o API
    ├── Generación PDF → html-to-pdf
    ├── Envío email → Resend
    └── Supabase
            ├── Auth (usuarios y empresas)
            ├── PostgreSQL (todos los datos)
            └── Storage (PDFs guardados)
```

---

## 3. Módulos de la aplicación

### ⚙️ Configuración

#### Datos de empresa
- Razón social / Nombre autónomo
- NIF / CIF
- Dirección fiscal
- Teléfono, email, web
- Logo
- Datos bancarios (IBAN, banco)
- Configuración regional por defecto (país, área, zona, municipio)

#### Series numéricas (estilo Business Central)
```
SERIES
  ├── Presupuestos
  │     ├── Prefijo: PRES, OFE, PRE...
  │     ├── Año automático: sí/no  → PRES-2026-0001
  │     ├── Dígitos: 4, 5...
  │     └── Último número usado
  └── Facturas
        ├── Prefijo: FAC, F, INV...
        ├── Año automático: sí/no  → FAC-2026-0001
        ├── Dígitos: 4, 5...
        └── Último número usado
```
Numeración correlativa e irrompible conforme a normativa fiscal.

#### Tipos de IVA
- IVA General → 21% (por defecto en obras)
- IVA Reducido → 10% (rehabilitación vivienda habitual)
- IVA Superreducido → 4%
- Exento → 0%

Cada línea del presupuesto/factura puede tener su propio % de IVA.

---

### 💰 Tabla de precios

#### Sistema geográfico
```
País
  └── Área geográfica (ej: Cataluña, Andalucía)
        └── Zona (ej: costa, interior, capital)
              └── Municipio
```

#### Categorías de trabajo
- Albañilería
- Electricidad
- Fontanería
- Carpintería
- Pintura
- Solados y alicatados
- Yeso y escayola
- (personalizables)

#### Estructura de partida completa

```
PARTIDA (ej: "Alicatado de baño")
  ├── MANO DE OBRA
  │     ├── Horas estimadas
  │     ├── Coste hora por zona
  │     └── Subtotal mano de obra
  │
  ├── MATERIALES ESTIMADOS
  │     ├── Material 1
  │     │     ├── Cantidad estimada
  │     │     ├── Rendimiento (merma % incluida)
  │     │     ├── Precio unitario (manual o API proveedor)
  │     │     └── Subtotal material
  │     └── Material N...
  │
  ├── COSTES INDIRECTOS
  │     ├── % sobre total (transporte, medios auxiliares...)
  │     └── Subtotal indirectos
  │
  ├── % MARGEN / BENEFICIO
  │     └── Configurable por categoría o por partida
  │
  └── PRECIO FINAL PARTIDA
        ├── Desglose visible internamente
        ├── El cliente solo ve el precio final (configurable)
        └── % IVA aplicado
```

#### Vista interna vs vista cliente

**Vista interna (el profesional):**
| Concepto | Detalle | Coste |
|---|---|---|
| Mano de obra | 8h × 18€/h | 144,00€ |
| Azulejo 30x60 | 12m² × 22€ (+10% merma) | 290,40€ |
| Adhesivo C2 | 4 sacos × 8€ | 32,00€ |
| Juntas | 2 kg × 6€ | 12,00€ |
| Indirectos 5% | | 23,92€ |
| Margen 20% | | 100,46€ |
| **Total partida** | | **602,78€** |

**Vista del cliente (en el PDF):**
| Partida | Ud | Cant | Precio ud | Total |
|---|---|---|---|---|
| Alicatado baño completo | m² | 11 | 54,80€ | 602,78€ |

---

### 🏪 Proveedores y materiales

#### Fase 1 — Gestión propia

```
PROVEEDORES
  ├── Nombre, NIF/CIF, dirección
  ├── Contacto (teléfono, email, web)
  ├── Área geográfica (dónde sirve)
  └── Categorías que suministra

PRODUCTOS / MATERIALES
  ├── Código de producto
  ├── Descripción
  ├── Categoría (cemento, pintura, tubería, cable...)
  ├── Unidad de medida (ud, kg, l, m², saco...)
  ├── Proveedor principal y alternativos
  └── PRECIOS POR PROVEEDOR Y ZONA
        ├── Proveedor
        ├── País / Área / Zona / Municipio
        ├── Precio de coste
        ├── % Margen aplicado
        └── Precio de venta resultante
```

#### Fase 2 — Integración en tiempo real (futuro)

| Proveedor | Integración posible |
|---|---|
| Leroy Merlin | API pública de productos y precios |
| Rexel (electricidad) | API para distribuidores |
| Würth | Portal B2B con API |
| Saint-Gobain | Integración para profesionales |
| Proveedores locales | Scraping o CSV periódico como fallback |

**Funcionalidades futuras:**
- Consulta precio en tiempo real al generar presupuesto
- Alerta si el precio ha subido desde el último presupuesto
- Comparador de precio entre proveedores
- Actualización automática del catálogo (diaria/semanal)
- Consulta de disponibilidad de stock
- Reserva de material desde la app

---

### 👥 Clientes

```
CLIENTES
  ├── Nombre / Razón social
  ├── NIF / CIF
  ├── Dirección
  ├── Teléfono y email
  ├── Tipo: particular / empresa
  └── Historial de presupuestos y facturas
```

---

### 🤖 Agente IA

- Chat por texto con GPT-4o
- El profesional describe la obra en lenguaje natural
- El agente identifica partidas, consulta precios por zona y materiales
- Calcula mano de obra + materiales + indirectos + margen automáticamente
- Genera presupuesto estructurado listo para editar
- El profesional puede ajustar cualquier línea antes de confirmar

---

### 📄 Presupuestos (estilo Business Central)

```
PRESUPUESTO (cabecera)
  ├── Número (serie automática)
  ├── Fecha
  ├── Estado: Borrador / Enviado / Aceptado / Rechazado
  ├── Cliente
  └── LÍNEAS DE PRESUPUESTO
        ├── Descripción de partida
        ├── Unidad, cantidad, precio unitario
        ├── Desglose interno (mano de obra + materiales + margen)
        └── % IVA por línea
```

**Funcionalidades:**
- Generación de PDF profesional con logo
- Envío por email
- Impresión

---

### 🧾 Facturas (estilo Business Central)

```
FACTURA (cabecera)
  ├── Número (serie automática correlativa)
  ├── Fecha
  ├── Estado: Borrador / Emitida / Pagada / Vencida
  ├── Presupuesto origen (opcional)
  ├── Cliente
  └── LÍNEAS DE FACTURA
        ├── Descripción, cantidad, precio
        ├── % IVA por línea
        └── Totales (base imponible + IVA desglosado + total)
```

**Funcionalidades:**
- Creación desde cero o desde presupuesto aceptado (1 click)
- IVA desglosado por línea
- Numeración correlativa automática conforme a Hacienda
- PDF, email e impresión

---

## 4. Flujo de trabajo principal

```
Profesional visita obra
        │
        ▼
Abre el chat con el agente
        │
        ▼
Describe lo que hay que hacer
        │
        ▼
Agente genera presupuesto
(precios zona + materiales + margen)
        │
        ▼
Profesional revisa y ajusta líneas
        │
        ▼
Envía PDF al cliente por email
        │
        ▼
Cliente acepta
        │
        ▼
Convierte a factura con un click
        │
        ▼
Emite y cobra
```

---

## 5. Flujo de estados de documentos

```
AGENTE (chat)
    │
    ▼
PRESUPUESTO BORRADOR
    │
    ├──[Editar manualmente] ──► PRESUPUESTO BORRADOR
    │
    ├──[Enviar al cliente] ───► PRESUPUESTO ENVIADO
    │                               │
    │                        [Aceptado / Rechazado]
    │                               │
    └──[Convertir a factura] ──► FACTURA BORRADOR
                                    │
                                    ├──[Emitir] ──► FACTURA EMITIDA
                                    │
                                    └──[Marcar pagada] ──► PAGADA
```

---

## 6. Fases de desarrollo

### Fase 1 — Fundamentos (2-3 semanas)
- Proyecto Expo configurado
- Supabase con esquema completo de base de datos
- Autenticación de usuarios
- Configuración de empresa, series e IVA
- Gestión de ubicaciones geográficas

### Fase 2 — Precios y materiales (2 semanas)
- Tabla de precios con jerarquía geográfica
- Catálogo de proveedores y materiales
- Configuración de partidas con desglose completo (mano de obra + materiales + margen)

### Fase 3 — Agente IA (2 semanas)
- Integración GPT-4o
- Prompt especializado en obras y reformas
- Generación automática de presupuesto desde el chat
- Edición del presupuesto generado

### Fase 4 — Documentos (2 semanas)
- Módulo completo de presupuestos (cabecera + líneas + estados)
- Módulo completo de facturas
- Conversión presupuesto → factura
- Series numéricas automáticas

### Fase 5 — PDF y comunicación (1 semana)
- Generación de PDF con diseño profesional
- Envío por email con Resend
- Impresión desde la app

### Fase 6 — Integración proveedores (futuro)
- APIs de precios en tiempo real
- Comparador de precios entre proveedores
- Alertas de variación de precios
- Consulta y reserva de stock

---

## 7. Nombre comercial — Análisis

### Candidatos evaluados

| Nombre | Fortaleza | Debilidad |
|---|---|---|
| **Obrai** | Directo, tecnológico | Poco conocido |
| **Reformia** | Claro para el sector hispano | Limitado fuera del ámbito hispanohablante |
| **Quantto** | Escalable internacionalmente | Conexión indirecta con el sector |
| **Partida** | Término técnico del sector | Muy local, difícil de internacionalizar |
| **Buildr** | Estilo startup moderno | Genérico fuera del sector tech |

### Recomendación

| Criterio | Reformia | Quantto |
|---|---|---|
| Mercado español | ✅ Perfecto | ✅ Funciona |
| Latinoamérica | ✅ Perfecto | ✅ Funciona |
| Europa no hispana | ❌ Limitado | ✅ Perfecto |
| USA / Global | ❌ No funciona | ✅ Perfecto |
| Conexión con el sector | ✅ Inmediata | 🟡 Indirecta |
| Memorabilidad | ✅ Alta | ✅ Alta |

**Si el mercado objetivo es España + Latinoamérica → Reformia**

**Si la ambición es Europa o global → Quantto**

### Pasos antes de decidir
1. Verificar dominio en [namecheap.com](https://namecheap.com) o [porkbun.com](https://porkbun.com)
2. Verificar marca en la OEPM (España) — [oepm.es](https://www.oepm.es)
3. Verificar marca europea en EUIPO — [euipo.europa.eu](https://euipo.europa.eu)
4. Verificar disponibilidad en redes sociales — [namechk.com](https://namechk.com)

---

*Documento generado a partir de la sesión de planificación del proyecto*
