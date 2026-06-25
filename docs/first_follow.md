##Conjuntos FIRST y FOLLOW
Para demostrar formalmente que la gramática de DroneScript es LL(1), se calcularon los conjuntos FIRST y FOLLOW de cada no-terminal. Estos conjuntos son la base teórica que garantiza que el parser descendente recursivo implementado puede tomar decisiones de derivación unívocas con un único token de anticipación (lookahead de 1).

**FIRST(X)**: conjunto de terminales con los que puede comenzar cualquier cadena derivada del símbolo X. Si X puede derivar la cadena vacía (λ), entonces λ también pertenece a FIRST(X).

**FOLLOW(X)**: conjunto de terminales que pueden aparecer inmediatamente a la derecha de X en alguna forma sentencial. Siempre incluye $ (fin de entrada) para el símbolo inicial.

**Condición LL(1)**: para cada no-terminal con varias alternativas de producción, los conjuntos FIRST de cada alternativa deben ser mutuamente disjuntos. Si una alternativa puede derivar λ, entonces FIRST de esa alternativa y FOLLOW del no-terminal también deben ser disjuntos.

### Tabla Conjuntos (First - Follow)

| No-terminal | FIRST | FOLLOW | Observación |
| :--- | :--- | :--- | :--- |
| **programa** | `{ MISION }` | `{ $ }` | El programa siempre empieza con MISION |
| **lista_misiones** | `{ MISION, λ }` | `{ $ }` | Puede ser vacía (λ) o iniciar otra misión |
| **mision** | `{ MISION }` | `{ MISION, $ }` | Siempre inicia con MISION |
| **bloque** | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, λ }` | `{ FIN }` | Puede ser vacío (λ). Termina cuando aparece FIN |
| **cmd** | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Cada alternativa inicia con un token terminal distinto → sin ambigüedad |
| **despegar** | `{ DESPEGAR }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | FIRST(despegar) = { DESPEGAR } |
| **unidad_opcional** | `{ m, km, s, %, λ }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN, VELOCIDAD }` | Puede ser vacía. FOLLOW incluye todo lo que puede seguir a una unidad |
| **mover** | `{ MOVER }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Consume MOVER y delega la decisión a resto_mover |
| **resto_mover** | `{ norte, sur, este, oeste, noreste, noroeste, sureste, suroeste, arriba, abajo, BASE }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Resultado de factorizar mover por izquierda. FIRST(direccion) y FIRST(BASE) son disjuntos |
| **direccion** | `{ norte, sur, este, oeste, noreste, noroeste, sureste, suroeste, arriba, abajo }` | `{ NUMBER }` | Siempre seguido de un número de distancia. Todos son IDENT con subtype='direccion' |
| **velocidad_opcional** | `{ VELOCIDAD, λ }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Opcional; si aparece, siempre empieza con VELOCIDAD |
| **aterrizar** | `{ ATERRIZAR }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Instrucción terminal sin parámetros |
| **sensor_cmd** | `{ SENSOR }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | FIRST(sensor_cmd) = { SENSOR } |
| **condicional** | `{ SI }` | `{ DESPEGAR, MOVER, ATERRIZAR, SENSOR, SI, FIN }` | Permite anidamiento: el cmd interno puede ser otro condicional |
| **tipo_sensor** | `{ temperatura, bateria, altura, velocidad, viento }` | `{ FRECUENCIA }` | Siempre seguido de FRECUENCIA |
| **op** | `{ <, >, <=, >=, == }` | `{ NUMBER }` | Operadores relacionales; siempre seguido de un valor numérico |

> **Nota:** λ denota la cadena vacía (producción nula). $ denota el fin de la entrada.
