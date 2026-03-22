-- Habilitar extension una sola vez por base de datos
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top consultas lentas por tiempo medio
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 30;

-- Top consultas por tiempo total acumulado
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 30;
