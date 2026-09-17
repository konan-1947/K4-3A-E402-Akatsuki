# StudyPulse backend

Backend Spring Boot chứa lớp gọi AI dùng chung và pipeline tạo mental model từ nhiều file.

## Mental model API

Frontend upload nhiều file lên `POST /api/mental-model/runs` bằng multipart field `files` và có thể gửi thêm
`topicInstruction`. API trả về `runId` để polling:

```bash
curl -X POST http://localhost:8080/api/mental-model/runs \
  -F 'files=@./docs/architecture.md' \
  -F 'files=@./docs/policy.pdf' \
  -F 'topicInstruction=Giải thích ngắn gọn cho sinh viên năm nhất'

curl http://localhost:8080/api/mental-model/runs/{runId}
curl http://localhost:8080/api/mental-model/runs/{runId}/result
```

Job chạy nền và lưu artifact vào `runs/<runId>/`. V1 dùng in-memory job registry, nên job không được khôi phục
nếu backend restart.

## Provider order

`AiClient` gọi DeepSeek trước. Nếu request lỗi, nó thử lại bằng OpenAI. API key được đọc từ `.env` trong
thư mục backend; file này đã bị Git bỏ qua. Điền key theo mẫu trong `.env.example`.

## Chạy và kiểm thử

```bash
cd codebase/be
# Điền APP_AI_DEEPSEEK_API_KEY và APP_AI_OPENAI_API_KEY vào .env trước.
./mvnw test
./mvnw spring-boot:run
```

Các unit test không gọi API thật.
