# Sample documents: MCP và quyền truy cập tool

Bộ file này dùng để thử flow upload nhiều tài liệu và tạo mental model.

## File trong bộ mẫu

- `01-overview.md`: mục tiêu và các thành phần chính.
- `02-request-flow.md`: luồng xử lý một request.
- `03-permission-policy.md`: nguyên tắc quyền tối thiểu và xác nhận người dùng.
- `04-server-tools.md`: các tool do MCP server công bố.
- `05-glossary.txt`: thuật ngữ dùng chung.
- `06-product-notes.md`: ghi chú triển khai và một điểm cần kiểm chứng.

Nên upload tất cả file cùng lúc để kiểm tra khả năng hợp nhất thông tin giữa nhiều nguồn.

## Kỳ vọng

Mental model nên giải thích được:

- MCP chuẩn hóa kết nối giữa AI client và MCP server.
- Server công bố tool/resource/prompt.
- Client khám phá năng lực trước khi gọi tool.
- Quyền tối thiểu, xác nhận người dùng và audit log là các lớp kiểm soát.
- Có thể phát hiện điểm chưa thống nhất về việc có cần xác nhận cho `calendar.read` hay không.
