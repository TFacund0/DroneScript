export const EXAMPLES = {
  valid1: `MISION "vuelo_simple"\n  DESPEGAR ALTITUD 50 m\n  ATERRIZAR\nFIN`,
  valid2: `MISION "patrulla_campo"\n  DESPEGAR ALTITUD 100 m\n  MOVER norte 200 m VELOCIDAD 5\n  SENSOR temperatura FRECUENCIA 10 s\n  SI bateria < 20 ENTONCES\n    ATERRIZAR\n  FIN\n  MOVER BASE\n  ATERRIZAR\nFIN`,
  valid3: `MISION "reconocimiento"\n  DESPEGAR ALTITUD 80 m\n  MOVER norte 150 m\n  MOVER este 100 m\n  SENSOR viento FRECUENCIA 5 s\n  SI viento > 30 ENTONCES\n    ATERRIZAR\n  FIN\n  MOVER BASE\n  ATERRIZAR\nFIN`,
  invalid1: `MISION "error_sin_numero"\n  DESPEGAR ALTITUD\nFIN`,
  invalid2: `MISION "error_falta_fin"\n  DESPEGAR ALTITUD 30 m\n  ATERRIZAR`,
  invalid3: `MISION "error_cmd_invalido"\n  DESPEGAR ALTITUD 80 m\n  GIRAR izquierda 90\nFIN`,
};

export const EXAMPLE = EXAMPLES.valid2;
