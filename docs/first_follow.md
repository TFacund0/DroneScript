# Análisis Teórico de la Gramática de DroneScript

Para demostrar formalmente que la gramática de DroneScript es de tipo **LL(1)** y, por ende, analizable mediante un parser descendente recursivo con un lookahead de 1 token, a continuación se presentan los conceptos teóricos y los conjuntos **FIRST** y **FOLLOW** de cada no-terminal.

---

## 1. Fundamentos Teóricos

*   **$\text{FIRST}(X)$**: Es el conjunto de símbolos terminales que pueden aparecer al principio de las cadenas derivadas del símbolo no-terminal $X$. Si el símbolo puede derivar en la cadena vacía, entonces $\lambda$ también pertenece al conjunto $\text{FIRST}(X)$.
*   **$\text{FOLLOW}(X)$**: Es el conjunto de símbolos terminales que pueden aparecer inmediatamente a la derecha de $X$ en alguna forma sentencial de la gramática. Siempre incluye el símbolo de fin de archivo o fin de entrada ($) para el símbolo inicial del programa.
*   **Condición LL(1)**: Para que una gramática sea LL(1), para cualquier regla de producción no-terminal con múltiples alternativas $A \rightarrow \alpha \mid \beta$:
    1.  $\text{FIRST}(\alpha)$ y $\text{FIRST}(\beta)$ deben ser mutuamente disjuntos.
    2.  Si una de las alternativas puede derivar en la cadena vacía ($\lambda$), entonces el conjunto $\text{FIRST}$ de la otra alternativa debe ser disjunto con $\text{FOLLOW}(A)$.

---

## 2. Tabla de Conjuntos FIRST y FOLLOW

> [!NOTE]
> *   $\lambda$ denota la cadena vacía (producción nula).
> *   `$` denota el fin de la entrada o EOF.
> *   Las direcciones y sensores están representados por el token general `IDENT` filtrado por su respectivo subtipo en el analizador léxico.

| No-terminal | FIRST | FOLLOW | Observación |
| :--- | :--- | :--- | :--- |
| **programa** | `{ MISION }` | `{ $ }` | El programa siempre empieza con `MISION`. |
| **lista_misiones** | `{ MISION, λ }` | `{ $ }` | Puede ser vacía ($\lambda$) o iniciar otra misión. |
| **mision** | `{ MISION }` | `{ MISION, $ }` | Siempre inicia con `MISION`. |
| **bloque** | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, λ }` | `{ FIN }` | Puede ser vacío ($\lambda$). Termina cuando aparece `FIN`. |
| **cmd** | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Cada alternativa inicia con un token terminal distinto $\rightarrow$ sin ambigüedad. |
| **despegar** | `{ DESPEGAR }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | $\text{FIRST}(\text{despegar}) = \{ \text{DESPEGAR} \}$. |
| **unidad_opcional** | `{ m, km, s, %, λ }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN, VELOCIDAD }` | Puede ser vacía. Su FOLLOW incluye todo lo que puede seguir a una unidad (incluyendo el token opcional de velocidad). |
| **mover** | `{ MOVER }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Consume `MOVER` y delega la decisión a `resto_mover`. |
| **resto_mover** | `{ norte, sur, este, oeste, noreste, noroeste, sureste, suroeste, arriba, abajo, BASE }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Resultado de factorizar `mover` por izquierda. $\text{FIRST}(\text{direccion})$ y $\text{FIRST}(\text{BASE})$ son disjuntos. |
| **direccion** | `{ norte, sur, este, oeste, noreste, noroeste, sureste, suroeste, arriba, abajo }` | `{ NUMBER }` | Las direcciones de movimiento están representadas por el token `IDENT` con el subtipo `'direccion'`. Su FOLLOW es únicamente `{ NUMBER }` porque siempre precede a la distancia. |
| **velocidad_opcional** | `{ VELOCIDAD, λ }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Opcional; si aparece, siempre empieza con el token de palabra reservada `VELOCIDAD`. |
| **aterrizar** | `{ ATERRIZAR }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Instrucción terminal de parada sin parámetros. |
| **sensor_cmd** | `{ SENSOR }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | $\text{FIRST}(\text{sensor\_cmd}) = \{ \text{SENSOR} \}$. |
| **condicional** | `{ SI }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Permite anidamiento: el comando interno puede ser otro condicional. |
| **tipo_sensor** | `{ temperatura, bateria, altura, velocidad, viento }` | `{ FRECUENCIA }` | Nombre del sensor de telemetría, siempre seguido de la palabra reservada `FRECUENCIA`. |
| **op** | `{ <, >, <=, >=, == }` | `{ NUMBER }` | Operadores relacionales; siempre seguidos de un valor numérico para la condición. |

---

## 3. Justificación de Consistencia (Correcciones Realizadas)

En el diseño inicial existía una duplicidad y una discrepancia en los no-terminales que definen el movimiento:
1.  **Unificación de Conceptos**: Se unificaron `movimiento` y `direccion` bajo el no-terminal **`direccion`**, ya que ambos representan las palabras clave de coordenadas espaciales (norte, sur, etc.) procesadas por el lexer como `IDENT (subtype: 'direccion')`.
2.  **Ajuste del FOLLOW de Dirección**: Dado que en la producción de movimiento el no-terminal de dirección precede inmediatamente al valor de la distancia, su conjunto de seguimiento debe ser obligatoriamente:
    $$\text{FOLLOW}(\text{direccion}) = \{ \text{NUMBER} \}$$
    (En la versión anterior se le asignaba incorrectamente el FOLLOW de la instrucción completa de movimiento).
