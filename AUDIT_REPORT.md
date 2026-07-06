# Reporte de Auditoría Completa — Split Expenses

**Fecha de auditoría:** 2026-06-10
**Alcance:** Frontend (React + Zustand) y Backend (Express + Knex + PostgreSQL)

---

## ✅ ESTADO: RESUELTO — 2026-06-18

Los **25 issues** de este reporte fueron corregidos y verificados archivo por archivo el **2026-06-18**.

- **CRITICAL (#1–#4):** resueltos
- **HIGH (#5–#12):** resueltos
- **MEDIUM (#13–#21):** resueltos
- **LOW (#22–#25):** resueltos

La mayoría ya estaba corregida en iteraciones previas. Las únicas correcciones aplicadas en la verificación final del 2026-06-18 fueron:
1. **#3 (frontend)** — guard de división por cero en `calculateBalances.js` (espejo cliente del fix de backend).
2. **Lint** — se eliminaron los `setState` dentro de `useEffect` en `EditMemberModal.jsx` (reset al cerrar) y `EditGroupModal.jsx` (componente interno con `key`), dejando `npm run lint` sin errores.

Las descripciones originales se conservan abajo como registro histórico.

---

## CRITICAL (datos corruptos o comportamiento incorrecto)

### 1. Lógica de settlement incorrecta — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/expenseController.js` (líneas 110-135)
- **Archivo:** `backend/src/controllers/groupController.js` (líneas 225-228)
- **Descripción:** Al saldar una deuda, el balance del deudor nunca se corrige. Solo se reduce el balance del acreedor. Si el acreedor tenía +$100 y el deudor -$100, tras saldar $100 el acreedor queda en $0 pero el deudor permanece en -$100.

### 2. Sin autorización en endpoints protegidos — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/groupController.js` (update, listMembers, addMember, removeMember, balances, sendSummary)
- **Archivo:** `backend/src/controllers/expenseController.js` (list, getById, create, remove)
- **Archivo:** `backend/src/controllers/userController.js` (updateById)
- **Descripción:** Cualquier usuario autenticado puede modificar/eliminar cualquier grupo, cualquier gasto, y actualizar el perfil de cualquier otro usuario. No hay verificación de membresía ni propiedad.

### 3. División por cero en cálculo de balances — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/groupController.js` (líneas 225 y 299)
- **Descripción:** Si un expense no tiene entries en `expense_splits`, `splitMembers.length` es 0 y `amount / 0` produce `Infinity`, corrompiendo todo el cálculo de balances del grupo.

### 4. Creación de expenses no atómica — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/expenseController.js` (líneas 69-82 y 104-135)
- **Descripción:** El insert del expense y el insert de `expense_splits` no están envueltos en una transacción. Si falla el segundo, queda un expense huérfano sin splits, lo que a su vez dispara el bug #3 (división por cero).

---

## HIGH (crashes o funcionalidad rota)

### 5. `formatRelativeDate` muestra "Invalid Date" para eventos de actividad — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/utils/dateFormat.js` (línea 16)
- **Archivo:** `frontend/src/components/dashboard/RecentActivity.jsx` (línea 84)
- **Descripción:** La función concatena `'T00:00:00'` al string de fecha. Los eventos de actividad usan ISO completo (ej: `2026-06-10T15:30:00.000Z`), resultando en `2026-06-10T15:30:00.000ZT00:00:00` — una fecha inválida.

### 6. `selectedGroup` queda vacío en BalancesPage — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/pages/BalancesPage.jsx` (línea 16)
- **Descripción:** `useState(groups[0]?.id || '')` se ejecuta cuando `groups` es `[]` (carga async). El initializer solo corre una vez, así que `selectedGroup` queda como `''` permanentemente. La página no muestra balances hasta que el usuario selecciona manualmente un grupo.

### 7. Botón "Guardar cambios" no funciona en ProfilePage — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/pages/ProfilePage.jsx` (línea 45)
- **Descripción:** El botón no tiene `onClick` ni `onSubmit`. Los inputs de nombre y email usan `defaultValue` sin refs ni estado controlado, haciendo imposible leer los valores editados.

### 8. DeleteGroupModal no resetea el step al cerrar con Escape/overlay — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/components/groups/DeleteGroupModal.jsx` (líneas 14, 22-25)
- **Archivo:** `frontend/src/components/ui/Modal.jsx` (líneas 13, 30)
- **Descripción:** Si el usuario llega al paso 2 ("Enviar resumen") y cierra el modal con Escape o click en overlay, `Modal.jsx` llama `closeModal()` directamente sin pasar por `handleClose`, así que `step` nunca se resetea a `'confirm'`. Al reabrir el modal, muestra el paso incorrecto.

### 9. Avatar crash con `name` undefined — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/components/ui/Avatar.jsx` (línea 24)
- **Archivo:** `frontend/src/components/layout/Header.jsx` (línea 60)
- **Descripción:** `name.split(' ')` lanza `TypeError` si name es `undefined`. Alcanzable desde `Header.jsx` con `<Avatar name={user?.name} />` cuando `user` aún no cargó.

### 10. Login crashea para usuarios invitados — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/authController.js` (línea 62)
- **Descripción:** Los usuarios con `status: 'invited'` tienen `password: null`. `bcrypt.compare(password, null)` lanza `TypeError`. Express 5 lo atrapa y devuelve 500, pero debería devolver 401.

### 11. Login expone datos sensibles — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/authController.js` (líneas 67-69)
- **Descripción:** El login hace `select *` y solo remueve `password`, dejando expuestos `status`, `cbu`, `payment_alias`, y cualquier columna futura. El endpoint de register sí usa whitelist de campos.

### 12. Todos los usuarios expuestos vía GET /users — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/userController.js` (líneas 5-7)
- **Descripción:** `GET /api/users` devuelve todos los usuarios del sistema con email, CBU (cuenta bancaria) y payment_alias a cualquier usuario autenticado. Problema de privacidad con datos financieros.

---

## MEDIUM (comportamiento incorrecto bajo ciertas condiciones)

### 13. Estadísticas de ProfilePage incluyen settlements — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/pages/ProfilePage.jsx` (línea 18)
- **Descripción:** `totalExpenses` suma todos los expenses incluyendo settlements (`category: 'settlement'`). Todas las demás páginas (ExpensesPage, GroupDetailPage, GroupCard) filtran settlements antes de sumar. Infla "Total general" y "Pagado por vos".

### 14. `paidBy` puede referenciar usuario fuera del grupo — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/components/expenses/AddExpenseForm.jsx` (líneas 28, 43)
- **Descripción:** Al cambiar de grupo en el formulario, `paidBy` se resetea a `user?.id`. Si el usuario actual no es miembro del grupo seleccionado, el estado tiene un ID inválido pero el dropdown visualmente muestra el primer miembro. Enviar el formulario crea un gasto con un `paidBy` incorrecto.

### 15. Sin empty state en BalancesPage — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/pages/BalancesPage.jsx`
- **Descripción:** Cuando el usuario no tiene grupos, se ve un título, un dropdown vacío, y nada más. No hay mensaje tipo "Creá un grupo para ver balances".

### 16. Keys con índice en BalanceCard — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/pages/GroupDetailPage.jsx` (línea 269)
- **Archivo:** `frontend/src/pages/BalancesPage.jsx` (línea 92)
- **Descripción:** `key={i}` en el map de debts. Si se salda una deuda y la lista cambia, React puede reutilizar estado del componente incorrecto (ej: el estado `copied` del botón de copiar alias).

### 17. `updateMe` limitado y frágil — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/userController.js` (líneas 26-31)
- **Descripción:** Solo extrae `payment_alias` del body. Si no viene, se destructura como `undefined` y Knex puede setear la columna a NULL. Además, no permite actualizar `name` ni `cbu` desde el propio perfil, pero `updateById` (sin verificación de propiedad) sí permite todo.

### 18. `addMember` no verifica existencia del grupo ni del usuario — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/controllers/groupController.js` (líneas 167-183)
- **Descripción:** Si el grupo o el usuario no existen, el insert falla con violación de FK y devuelve 500 en vez de 404/400.

### 19. HTML injection en emails — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/services/emailService.js` (líneas 36-37)
- **Descripción:** `inviterName` y `groupName` son strings controlados por el usuario e insertados directamente en HTML sin escapar. Un usuario podría inyectar `<img src=x onerror=...>` en su nombre.

### 20. CORS hardcodeado a localhost — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/index.js` (línea 13)
- **Descripción:** `cors({ origin: 'http://localhost:5173' })` — en producción el frontend en otro dominio será bloqueado. Debería usar una variable de entorno.

### 21. Config de DB hardcodeada a development — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/config/db.js` (línea 4)
- **Descripción:** `knex(config.development)` está hardcodeado. Ignora `NODE_ENV`, así que en producción usa la config de desarrollo.

---

## LOW (UX, performance)

### 22. Sin empty state en GroupOverview — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/components/dashboard/GroupOverview.jsx`
- **Descripción:** Cuando no hay grupos, se renderiza una card con header "Mis grupos" y una lista vacía, sin mensaje informativo.

### 23. Sin empty state en RecentActivity — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/components/dashboard/RecentActivity.jsx`
- **Descripción:** Cuando no hay expenses ni eventos, se renderiza una card con una lista vacía.

### 24. `useMemo` con dependencias inestables en GroupCard — ✅ Resuelto (2026-06-18)
- **Archivo:** `frontend/src/components/groups/GroupCard.jsx` (líneas 19-22)
- **Descripción:** `groupExpenses` y `groupMembers` se crean con `.filter()` en cada render, generando nuevas referencias. El `useMemo` de `hasDebts` se recalcula en cada render, anulando su propósito.

### 25. Sin rate limiting en auth endpoints — ✅ Resuelto (2026-06-18)
- **Archivo:** `backend/src/routes/auth.js`
- **Descripción:** `/api/auth/login` y `/api/auth/register` no tienen rate limiting, permitiendo ataques de fuerza bruta.
