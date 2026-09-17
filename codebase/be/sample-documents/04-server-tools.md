# MCP server: calendar tools

## Tool registry

Server hiện công bố ba tool:

### calendar.read

Đọc event trong một khoảng thời gian.

Input bắt buộc:

```json
{
  "calendarId": "string",
  "from": "ISO-8601 datetime",
  "to": "ISO-8601 datetime",
  "timezone": "IANA timezone"
}
```

Tool này không tạo, sửa hoặc xóa event.

### calendar.create

Tạo một event mới. Tool yêu cầu confirmation token được phát hành sau khi người dùng xác nhận title, thời gian, người tham gia và calendar đích.

### calendar.delete

Xóa event theo event id. Đây là thao tác có tác động cao, cần confirmation token riêng cho từng event.

## Quy tắc registry

Client phải gọi `tools.list` khi bắt đầu session hoặc khi registry version thay đổi. Không được cache schema vô thời hạn.

Server có thể gỡ một tool khỏi registry. Khi đó client phải dừng request đang dùng tool đó và báo lỗi có thể giải thích cho người dùng.

## Error response

Error response gồm `code`, `message`, `retryable` và `requestId`. Không trả stack trace hoặc thông tin credential về client.
