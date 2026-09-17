# Request flow: tìm lịch trống

## Bối cảnh

Người dùng muốn biết các khung giờ trống để sắp xếp một cuộc họp. AI không được tự đoán lịch từ trí nhớ hoặc từ dữ liệu cũ.

## Các bước

1. Người dùng gửi mục tiêu cho AI client.
2. AI client hỏi MCP server danh sách năng lực hiện có.
3. MCP server trả về tool `calendar.read` với mô tả và schema tham số.
4. AI client kiểm tra khoảng thời gian và timezone trước khi gọi tool.
5. Server kiểm tra client có quyền đọc calendar hay không.
6. Server gọi calendar service.
7. Calendar service trả về các event trong khoảng thời gian yêu cầu.
8. MCP server chuẩn hóa kết quả thành các khoảng thời gian rảnh.
9. AI client giải thích kết quả cho người dùng và dẫn nguồn từ calendar response.

## Không được làm

- Không gọi tool không có trong danh sách server công bố.
- Không tự thêm tham số ngoài schema.
- Không tạo hoặc sửa event trong flow chỉ đọc lịch.
- Không khẳng định một khung giờ trống nếu server chưa trả dữ liệu.

## Dữ liệu cần truy vết

Mỗi request nên ghi lại request id, user id, tool name, tham số đã chuẩn hóa, thời điểm gọi, kết quả và lỗi nếu có.
