
/wait-for-it.sh $DATABASE_HOST:$DATABASE_PORT -t 60
/wait-for-it.sh $REDIS_HOST:$REDIS_PORT -t 120

echo "[entrypoint] Running TypeORM migrations..."
if npx typeorm migration:run -d ./dist/core/database/typeOrm.config.js; then
  echo "[entrypoint] ✅ Migrations completed successfully."
else
  echo "[entrypoint] ⚠️ Migration failed — continuing startup anyway."
fi

echo "🚀 Starting NestJS app..."
node dist/main.js
