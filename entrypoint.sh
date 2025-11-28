
/wait-for-it.sh mysql:3306 -t 60
/wait-for-it.sh redis:6379 -t 60

echo "[entrypoint] Running TypeORM migrations..."
if npx typeorm migration:run -d ./dist/core/database/typeOrm.config.js; then
  echo "[entrypoint] ✅ Migrations completed successfully."
else
  echo "[entrypoint] ⚠️ Migration failed — continuing startup anyway."
fi

echo "🚀 Starting NestJS app..."
node dist/main.js
