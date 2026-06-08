# Smart Mixer Server – REST API (MongoDB + SQLite)

שרת Node.js שמשמש את הבקר הראשי ואת אתר הניהול. שני DB-ים: MongoDB למתכונים, SQLite לטבלאות (חומרים, כלים, כמויות, המרות משקל, סוגי קצף).

## דרישות

- Node.js 18+
- MongoDB Community מותקן ורץ על `mongodb://127.0.0.1:27017`

## התקנה והרצה ראשונה

```bash
cd SmartMixerServer
npm install
npm run init-db          # יוצר את 5 טבלאות SQLite
npm run set-password     # קובע את סיסמת העריכה (פעם אחת)
```

`npm run set-password` ידפיס שורה כמו:
```
EDIT_PASSWORD_HASH=$2a$10$....
```
העתיקי אותה ל-`.env` (יש שורה ריקה מחכה).

ערכי גם את `SESSION_SECRET` ב-`.env` למחרוזת רנדומלית ארוכה.

```bash
npm start
```

תראי:
```
[SQLite] opened: ./smart_mixer.db
[SQLite] schema ready. Tables: amounts, foam_types, ingredients, units, weight_conversions
[Mongo] connected: mongodb://127.0.0.1:27017/smart_mixer
HTTP server listening on http://localhost:4000
```

## מודל הגישה

- **קריאה (GET)** → חופשי לכולם (בקר, אתר, כל לקוח)
- **שינויים (POST/PUT/DELETE)** → דורש session פעיל

הדרך להשיג session: שולחים `POST /api/auth/verify` עם הסיסמה. השרת מחזיר cookie. הדפדפן יחזיר אותו אוטומטית בכל בקשה הבאה.

## כל ה-Endpoints

### Auth (`/api/auth`)

| Method | Path | תיאור |
|---|---|---|
| POST | `/api/auth/verify` | `{ password }` → session cookie |
| POST | `/api/auth/logout` | מוחק את ה-session |
| GET | `/api/auth/status` | `{ authenticated: true/false }` |

### מתכונים (`/api/recipes`)

| Method | Path | אימות |
|---|---|---|
| GET | `/api/recipes` | – |
| GET | `/api/recipes/:id` | – |
| POST | `/api/recipes` | ✓ |
| PUT | `/api/recipes/:id` | ✓ |
| DELETE | `/api/recipes/:id` | ✓ |

**סינון ב-GET /api/recipes** (כל הפרמטרים אופציונליים):
- `?difficulty=3` – קושי עד 3 (כולל)
- `?category=עוגות` – קטגוריה ספציפית
- `?ingredientIds=1,2,3,5,8` – רק מתכונים שכל החומרים שלהם ברשימה

דוגמה: `/api/recipes?category=עוגות&difficulty=2&ingredientIds=1,2,3,5`

### חומרים (`/api/ingredients`)

| Method | Path | אימות |
|---|---|---|
| GET | `/api/ingredients` | – |
| GET | `/api/ingredients/:id` | – |
| POST | `/api/ingredients` | ✓ |
| PUT | `/api/ingredients/:id` | ✓ |
| DELETE | `/api/ingredients/:id` | ✓ |

POST body: `{ "name": "סוכר", "recordingId": null }`

### כלי מדידה (`/api/units`)
אותו דבר כמו ingredients. POST body: `{ "name": "כוס", "recordingId": null }`

### כמויות (`/api/amounts`)
POST body: `{ "amount": 0.5, "recordingId": null }`

### המרות משקל (`/api/conversions`)

| Method | Path | אימות |
|---|---|---|
| GET | `/api/conversions` | – |
| GET | `/api/conversions/:ingredientId/:unitId` | – |
| POST | `/api/conversions` | ✓ |
| PUT | `/api/conversions/:ingredientId/:unitId` | ✓ |
| DELETE | `/api/conversions/:ingredientId/:unitId` | ✓ |

POST body: `{ "ingredientId": 3, "unitId": 1, "averageGrams": 200 }`

הבקר אמור לעשות `GET /api/conversions` פעם אחת באתחול ולשמור בזיכרון.

### סוגי קצף (`/api/foam-types`)
POST body: `{ "name": "קצף יציב", "heightPerEggCm": 4.5 }`

### Health Check
`GET /api/health` → `{ ok: true, time: "..." }`

## דוגמאות curl

```bash
# כניסה כעורך
curl -c cookies.txt -X POST http://localhost:4000/api/auth/verify \
     -H "Content-Type: application/json" \
     -d '{"password":"yourpassword"}'

# הוספת חומר (משתמש ב-cookie שנשמר)
curl -b cookies.txt -X POST http://localhost:4000/api/ingredients \
     -H "Content-Type: application/json" \
     -d '{"name":"קמח"}'

# קריאה (לא דורש cookie)
curl http://localhost:4000/api/ingredients

# סינון מתכונים
curl "http://localhost:4000/api/recipes?category=עוגות&difficulty=3"

# יציאה
curl -b cookies.txt -X POST http://localhost:4000/api/auth/logout
```

## הפרדה בין שכבות

- **`models/`** – לוגיקה עסקית, ולידציה, גישה לדאטה. לא יודע על HTTP.
- **`routes/`** – ממיר request לקריאת model ומחזיר response. לא יודע איך הוולידציה עובדת.
- **`middleware/`** – תמיכה רוחבית (אימות, שגיאות).

הסיבה: אם בעתיד תרצי להחליף את ה-API מ-REST ל-WebSocket או GraphQL – אין צורך לגעת ב-`models/`.

## בעיות נפוצות

| תופעה | סיבה |
|---|---|
| `Edit password is not configured` | לא הרצת `npm run set-password` |
| `Authentication required` ב-POST/PUT/DELETE | חסר session cookie – שלחי קודם `/api/auth/verify` |
| `Validation failed` | הקלט לא תקין – ראי `details` בתגובה |
| `Invalid id` (CastError) | מזהה מתכון בפורמט שגוי |
| `ingredient X does not exist in SQLite` | מנסה ליצור מתכון עם id של חומר שלא קיים |

## פיתוח האתר בנפרד

אם את בונה את האתר ב-`http://localhost:3000` והשרת ב-`http://localhost:4000`:

ב-fetch בצד האתר, חשוב להוסיף `credentials: 'include'`:
```javascript
fetch('http://localhost:4000/api/auth/verify', {
  method: 'POST',
  credentials: 'include',          // חשוב לקבל וקבל cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: '...' })
});
```

ה-CORS בשרת כבר מוגדר לקבל credentials מכל מקור (לפיתוח). לייצור – יש להגביל ל-origin הספציפי של האתר.
