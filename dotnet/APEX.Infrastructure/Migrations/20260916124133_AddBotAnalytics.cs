using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace APEX.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBotAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BotAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    DetailsJson = table.Column<string>(type: "TEXT", nullable: true),
                    TokensUsed = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BotAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BotAnalytics_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BotAnalytics_UserId_ActionType",
                table: "BotAnalytics",
                columns: new[] { "UserId", "ActionType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BotAnalytics");
        }
    }
}
