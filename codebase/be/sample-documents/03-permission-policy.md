# Permission policy và quyền tối thiểu

## Nguyên tắc quyền tối thiểu

Mỗi client chỉ nhận các tool cần cho nhiệm vụ hiện tại. Một tool đọc dữ liệu không được mặc nhiên có quyền ghi, xóa hoặc gửi dữ liệu ra ngoài.

Ví dụ:

| Tool | Quyền | Tác động |
| --- | --- | --- |
| `calendar.read` | đọc lịch | không thay đổi dữ liệu |
| `calendar.create` | tạo event | thay đổi dữ liệu |
| `calendar.delete` | xóa event | thay đổi dữ liệu, rủi ro cao |

## Xác nhận người dùng

Các tool làm thay đổi dữ liệu phải yêu cầu người dùng xác nhận ngay trước khi thực thi. Xác nhận trước đó không được tái sử dụng nếu tham số, người nhận hoặc phạm vi hành động thay đổi.

Tool chỉ đọc thường không cần xác nhận riêng cho từng lần gọi nếu user đã cho phép đọc dữ liệu trong phạm vi request hiện tại. Tuy nhiên, client phải hiển thị rõ dữ liệu nào đang được đọc.

## Server-side enforcement

Không được chỉ dựa vào prompt để bảo vệ quyền. MCP server phải kiểm tra:

- danh tính và scope của client;
- tool có được cấp cho client không;
- schema và kiểu dữ liệu của tham số;
- phạm vi dữ liệu được truy cập;
- yêu cầu xác nhận đối với hành động có side effect.

## Audit

Audit log phải đủ để trả lời bốn câu hỏi: ai gọi, gọi tool nào, với tham số nào và kết quả ra sao. Log không được chứa access token hoặc dữ liệu bí mật không cần thiết.
