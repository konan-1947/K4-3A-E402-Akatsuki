# Product notes — phiên bản thử nghiệm

## Phạm vi prototype

Prototype tập trung vào flow đọc lịch. Client chỉ cần khám phá `calendar.read`, kiểm tra schema, gọi server và hiển thị các khoảng thời gian trống.

Các thao tác `calendar.create` và `calendar.delete` có thể được bật trong môi trường development nhưng không được bật mặc định cho người dùng mới.

## Quyết định đang chờ xác nhận

Một ghi chú cũ nói rằng mọi lần gọi `calendar.read` đều phải hiện hộp thoại xác nhận. Policy mới nói thao tác đọc trong phạm vi user đã cho phép không cần xác nhận từng lần.

Đây là điểm cần product owner xác nhận trước khi phát hành. Trong mental model, không nên tự chọn một policy; hãy ghi lại mâu thuẫn và thể hiện policy mới như một candidate decision nếu có đủ evidence.

## Definition of done

- Tool registry hiển thị đúng schema.
- Request không gọi tool ngoài registry.
- Server từ chối scope không hợp lệ.
- Hành động có side effect yêu cầu confirmation token.
- Mọi request đều có request id trong audit log.
