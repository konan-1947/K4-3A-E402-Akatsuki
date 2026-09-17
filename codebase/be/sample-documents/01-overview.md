# MCP là lớp điều phối có cổng kiểm soát

## Mục đích

Model Context Protocol (MCP) chuẩn hóa cách một ứng dụng AI kết nối với các năng lực bên ngoài. Thay vì để model tự đoán cách gọi từng hệ thống, AI client làm việc với một MCP server có giao diện được công bố rõ ràng.

Mục tiêu chính là giúp request đi đúng công cụ, đúng tham số và có thể truy vết.

## Các thành phần

### Người dùng

Người dùng nêu mục tiêu, ví dụ “tìm một khung giờ trống trong tuần này”. Người dùng có thể cần xác nhận trước các hành động làm thay đổi dữ liệu.

### AI client

AI client nhận yêu cầu, khám phá các năng lực mà server công bố, chọn tool phù hợp và gửi request với tham số đã được kiểm tra.

### MCP server

MCP server công bố danh sách tool, resource và prompt. Server kiểm tra quyền, validate input, gọi hệ thống phía sau và trả về kết quả có cấu trúc.

### Hệ thống phía sau

Đây có thể là calendar, database, file store hoặc một API nội bộ. Hệ thống phía sau không cần hiểu cách model suy luận; nó chỉ nhận request hợp lệ từ server.

## Mental model một câu

MCP giống như một lễ tân có danh sách phòng ban và quy tắc chuyển tiếp: AI chỉ được gửi yêu cầu tới đúng bộ phận đã công bố, trong đúng phạm vi được phép.
