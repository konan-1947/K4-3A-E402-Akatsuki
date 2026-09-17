package com.akatsuki.studypulse.mental;

import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class MentalModelHtmlRendererTest {

    @Test
    void escapesModelTextBeforeRenderingHtml() throws Exception {
        var model = new ObjectMapper().readTree("{\"title\":\"<unsafe>\",\"oneSentence\":\"A & B\"}");

        String html = new MentalModelHtmlRenderer().render(model);

        assertTrue(html.contains("&lt;unsafe&gt;"));
        assertTrue(html.contains("A &amp; B"));
        assertTrue(!html.contains("<unsafe>"));
    }

    @Test
    void rendersMainContentWithoutInternalStructuredMetadata() throws Exception {
        var model = new ObjectMapper().readTree("""
                {
                  "title":"MCP",
                  "main_workflows":[{"name":"Request flow","steps":["Client gửi request","Server kiểm tra quyền"],"sources":["flow.md#chunk-2"]}],
                  "business_rules":[{"rule":"Least privilege","sources":["policy.md#chunk-1"]}]
                }
                """);

        String html = new MentalModelHtmlRenderer().render(model);

        assertTrue(html.contains("<strong>Request flow</strong>"));
        assertTrue(html.contains("Client gửi request"));
        assertTrue(html.contains("Least privilege"));
        assertTrue(html.contains("Điểm cần nhớ"));
        assertTrue(!html.contains("\"name\""));
        assertTrue(!html.contains("\"steps\""));
        assertTrue(!html.contains("Nguồn:"));
    }

    @Test
    void rendersPureMentalModelStructure() throws Exception {
        var model = new ObjectMapper().readTree("""
                {
                  "title":"MCP",
                  "scope":"Client, server và tool trong một request MCP.",
                  "purpose":"Kết nối ứng dụng AI với năng lực bên ngoài.",
                  "core_idea":"Client điều phối request qua server.",
                  "actors":["AI client","MCP server"],
                  "core_entities":["Tool","Request","Permission"],
                  "causal_mechanism":[{"when":"Client gửi request","then":"Server kiểm tra quyền","because":"Server là nơi thực thi kiểm soát."}],
                  "boundaries":["Không mô hình hóa UI cụ thể của client"]
                }
                """);

        String html = new MentalModelHtmlRenderer().render(model);

        assertTrue(html.contains("Phạm vi"));
        assertTrue(html.contains("Thành phần chính"));
        assertTrue(html.contains("Cơ chế hoạt động"));
        assertTrue(html.contains("Giới hạn"));
        assertTrue(!html.contains("Checkpoint"));
        assertTrue(!html.contains("Mục tiêu học"));
    }
}
