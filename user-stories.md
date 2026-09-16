# User stories — StudyPulse

## Mục tiêu sản phẩm

StudyPulse giúp học viên **nắm một mental model rõ ràng** cho concept khó. Lab coach dùng tài liệu có sẵn để tạo và duyệt nội dung theo ba tầng:

```text
Tài liệu nguồn → Mental model → Cấu trúc lesson → Bài viết đa phương tiện → Học viên học & checkpoint
                    duyệt 1           duyệt 2                  duyệt 3
```

AI không được đi thẳng từ tài liệu nguồn sang bài viết cuối. Mỗi tầng cần có trạng thái `draft` → `approved` để lab coach kiểm soát chất lượng và căn cứ kiến thức.

## Route và quyền chính

| Người dùng | Route | Có thể làm |
| --- | --- | --- |
| Lab coach | `/labcoach` | Chọn nguồn, tạo/chỉnh sửa/duyệt mental model, cấu trúc lesson và bài viết; xuất bản lesson. |
| Học viên | `/user` | Xem lesson đã xuất bản, tương tác mô phỏng, làm checkpoint và nhận phản hồi. |

---

## Cấu trúc lesson đề xuất

Sau khi mental model được duyệt, AI sinh một **lesson blueprint** gồm các block dưới đây. Lab coach có thể xoá, thêm hoặc đổi thứ tự block trước khi duyệt.

| Block | Mục đích | Dạng nội dung chính |
| --- | --- | --- |
| 1. Bối cảnh và câu hỏi dẫn | Gợi lại lúc học viên gặp khó khăn hoặc cần dùng concept. | Text ngắn + tình huống. |
| 2. Mental model | Cho học viên một cách hình dung trung tâm, dễ nhớ. | Một câu, phép so sánh và hình/diagram. |
| 3. Cơ chế theo từng bước | Giải thích các thành phần, quan hệ và luồng hoạt động. | Text ngắn, diagram. |
| 4. Ví dụ có hướng dẫn | Áp mental model vào một ví dụ cụ thể. | Text + hình/diagram. |
| 5. Mô phỏng tương tác | Cho học viên thay đổi input và quan sát kết quả. | HTML nhúng chạy trong lesson. |
| 6. Sai lầm thường gặp | Phân biệt mental model đúng với các hiểu nhầm phổ biến. | Text + đối chiếu trực quan. |
| 7. Checkpoint | Kiểm tra học viên có áp dụng được mental model không. | Câu hỏi, đáp án và giải thích. |
| 8. Tóm tắt và bước tiếp theo | Củng cố ý chính và gợi ý phần cần học tiếp. | Text ngắn + liên kết nguồn. |

MVP bắt buộc có block 2, 3, 4, 5 và 7. Các block còn lại là tuỳ chọn khi thiếu thời gian.

---

## User stories — Lab coach (`/labcoach`)

### US-LC-01 · Chọn tài liệu nguồn và phạm vi concept

**Là một** lab coach, **tôi muốn** chọn transcript, slide hoặc script liên quan đến một concept và xác định mục tiêu học, **để** AI chỉ dựa trên đúng nguồn được duyệt.

**Tính năng**

- Danh sách/tải lên tài liệu nguồn; mỗi tài liệu có tên, loại, đoạn hoặc trang được chọn.
- Trường `Concept`, ví dụ `Transformer Attention`, và `Mục tiêu sau lesson`.
- Nút `Tạo mental model` bị khoá nếu chưa có concept hoặc nguồn.

**Tiêu chí chấp nhận**

- Lưu liên kết giữa concept, mục tiêu và các nguồn đã chọn.
- Lab coach thấy lại toàn bộ nguồn trước khi gọi AI.

### US-LC-02 · Tạo mental model từ tài liệu

**Là một** lab coach, **tôi muốn** AI đề xuất mental model từ các tài liệu đã chọn, **để** có một khung giải thích trung tâm trước khi tạo bài viết.

**Tính năng**

- Nút `Tạo mental model bằng AI` tạo bản nháp gồm: tên, mental model một câu, phép so sánh/ẩn dụ, giải thích ngắn và citation nguồn.
- Hiển thị trạng thái `Đang tạo`, `Bản nháp`, `Cần bổ sung nguồn` hoặc `Lỗi`.
- Mỗi claim có nút mở citation để xem đoạn transcript hoặc slide liên quan.
- Nếu bằng chứng không đủ, AI chỉ ra phần thiếu thay vì tự bịa định nghĩa.

**Tiêu chí chấp nhận**

- Có ít nhất một lời gọi AI thật.
- Bản nháp chưa xuất hiện tại route học viên.

### US-LC-03 · Chỉnh sửa và duyệt mental model

**Là một** lab coach, **tôi muốn** chỉnh sửa và duyệt mental model, **để** bài viết sau đó bám theo cách giải thích mà tôi xác nhận là đúng.

**Tính năng**

- Có thể sửa tên, câu mental model, phép so sánh và giải thích.
- Có nút `Tạo lại`, `Lưu nháp` và `Duyệt mental model`.
- Sau khi duyệt, version mental model được khoá làm đầu vào blueprint; chỉnh sửa sau đó yêu cầu duyệt lại.

### US-LC-04 · Tạo cấu trúc bài viết từ mental model đã duyệt

**Là một** lab coach, **tôi muốn** AI tạo lesson blueprint dựa trên mental model đã duyệt, **để** kiểm tra mạch sư phạm trước khi sinh bài viết dài.

**Tính năng**

- Nút `Tạo cấu trúc lesson` chỉ khả dụng khi mental model là `approved`.
- AI sinh các block trong cấu trúc lesson; mỗi block có tiêu đề, mục tiêu, dạng nội dung, mô tả, nguồn tham chiếu và nhiệm vụ sinh nội dung.
- Mỗi block được gắn loại: `text`, `image`, `diagram`, `interactive-html` hoặc `checkpoint`.
- Với mô phỏng, AI tạo **simulation brief**: điều cần quan sát, input có thể thay đổi, output và insight phải rút ra.

**Tiêu chí chấp nhận**

- Blueprint tham chiếu đúng mental model đã duyệt.
- Có tối thiểu: mental model, cơ chế, ví dụ, mô phỏng và checkpoint.
- Chưa sinh bài viết hoàn chỉnh ở bước này.

### US-LC-05 · Chỉnh sửa và duyệt cấu trúc bài viết

**Là một** lab coach, **tôi muốn** chỉnh sửa, sắp xếp và duyệt blueprint, **để** chỉ sinh những phần nội dung thực sự cần cho học viên.

**Tính năng**

- Có thể đổi tiêu đề/mô tả, thêm/xoá block, kéo-thả đổi thứ tự và chọn block được sinh.
- Có preview ngắn từng block.
- Có nút `Lưu nháp`, `Duyệt cấu trúc`; `Sinh bài viết` chỉ mở sau khi blueprint được duyệt.

### US-LC-06 · Sinh bài viết đa phương tiện

**Là một** lab coach, **tôi muốn** AI sinh bài viết từ blueprint đã duyệt, **để** học viên có lesson liền mạch thay vì phải ghép nhiều tài liệu.

**Tính năng**

- Nút `Sinh bài viết` tạo nội dung theo từng block và báo tiến độ.
- Block text có tiêu đề, giải thích ngắn, citation và liên hệ về mental model.
- Block ảnh dùng `image placeholder` trong MVP, bao gồm mô tả hình cần có và alt text; sau này thay bằng ảnh tìm kiếm hoặc ảnh AI sinh.
- Block diagram dùng `diagram placeholder` trong MVP, bao gồm mô tả diagram và mã Mermaid dự kiến; sau này frontend render Mermaid.
- Block mô phỏng gồm HTML/CSS/JavaScript nhúng trong `iframe sandbox`, có nút chạy lại/reset; mã nhúng không được truy cập cookie, local storage hoặc trang cha.
- Block checkpoint có câu hỏi, đáp án, giải thích đúng/sai và liên kết đến phần nên xem lại.

**Tiêu chí chấp nhận**

- Bài viết giữ thứ tự block của blueprint đã duyệt.
- Text và checkpoint có căn cứ từ nguồn/mental model; citation vẫn mở được.
- Placeholder ảnh/diagram hiển thị rõ là placeholder, không giả là nội dung đã xác minh.
- Mô phỏng chạy trong preview mà không phá giao diện lesson.

### US-LC-07 · Rà soát, duyệt và xuất bản lesson

**Là một** lab coach, **tôi muốn** xem bài viết hoàn chỉnh, chỉnh sửa cuối và xuất bản, **để** học viên chỉ nhìn thấy lesson đã được duyệt.

**Tính năng**

- Preview giống route `/user`; có thể sửa text, thay placeholder, bật/tắt block hoặc tạo lại riêng một block.
- Trạng thái `draft`, `ready_for_review`, `approved`, `published`.
- Nút `Xuất bản` chỉ khả dụng khi mental model, blueprint và bài viết đã duyệt.

---

## User stories — Học viên (`/user`)

### US-US-01 · Mở lesson đã xuất bản

**Là một** học viên, **tôi muốn** chọn lesson theo concept, **để** học lại phần mình chưa hiểu.

**Tính năng**

- Danh sách lesson chỉ gồm nội dung `published`.
- Mỗi lesson hiển thị concept, mental model một câu và thời lượng ước tính.

### US-US-02 · Nắm mental model trước khi đi vào chi tiết

**Là một** học viên, **tôi muốn** thấy mental model, hình/diagram và lời giải thích ngắn ở đầu lesson, **để** có khung tư duy trước khi đọc cơ chế chi tiết.

**Tiêu chí chấp nhận**

- Mental model xuất hiện trước phần cơ chế và ví dụ.
- Học viên mở được citation để biết nguồn gốc thông tin.
- Placeholder ảnh/diagram hiển thị rõ trong prototype.

### US-US-03 · Khám phá bằng mô phỏng tương tác

**Là một** học viên, **tôi muốn** thay đổi input trong mô phỏng và quan sát kết quả, **để** hiểu quan hệ nhân quả của concept thay vì chỉ đọc lý thuyết.

**Tính năng**

- Mô phỏng HTML nhúng có chỉ dẫn “thử thay đổi gì” và “cần quan sát gì”.
- Có nút `Reset mô phỏng`.
- Có câu hỏi phản tư gắn với mental model.

### US-US-04 · Làm checkpoint và nhận phản hồi

**Là một** học viên, **tôi muốn** làm checkpoint sau lesson, **để** kiểm tra mình có áp dụng đúng mental model hay không.

**Tiêu chí chấp nhận**

- Có ít nhất một câu checkpoint.
- Sau khi trả lời, hiển thị phản hồi đúng/sai kèm giải thích.
- Nếu sai, phản hồi dẫn về đúng block cần xem lại, không chỉ đưa đáp án.

### US-US-05 · Hoàn tất lesson

**Là một** học viên, **tôi muốn** biết khi nào mình đã hoàn thành lesson, **để** tiếp tục concept khác hoặc xem lại phần còn yếu.

**Tiêu chí chấp nhận**

- Hoàn thành checkpoint sẽ hiện trạng thái hoàn thành.
- Có gợi ý xem lại mental model, mô phỏng hoặc tài liệu nguồn khi cần.

---

## Luồng MVP cần demo

1. Lab coach chọn hai nguồn về một concept.
2. AI tạo mental model có citation; lab coach sửa một câu và duyệt.
3. AI tạo blueprint; lab coach duyệt cấu trúc mental model → cơ chế → ví dụ → mô phỏng → checkpoint.
4. AI sinh lesson có text, placeholder ảnh, placeholder Mermaid diagram, một mô phỏng HTML nhúng và checkpoint.
5. Học viên mở lesson, thao tác mô phỏng, trả lời checkpoint và nhận phản hồi.

**Ngoài scope MVP:** tạo ảnh/diagram thật, quản lý phiên bản phức tạp, đăng nhập/phân quyền đầy đủ, thư viện lesson lớn và cá nhân hoá lộ trình học.
