# StudyPulse backend

Backend Spring Boot chứa lớp gọi AI dùng chung. Hiện chưa có REST endpoint; bước tiếp theo có thể inject
`AiClient` hoặc `@Qualifier("jsonAiClient") AiClient` vào use case tạo nội dung.

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
