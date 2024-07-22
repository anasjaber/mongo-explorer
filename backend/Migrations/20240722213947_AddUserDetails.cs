using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProfiledQueries");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "QueryLogs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Queries",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "OpenAISettings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "MongoConnections",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "OpenAISettings",
                keyColumn: "Id",
                keyValue: 1,
                column: "UserId",
                value: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "QueryLogs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Queries");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "OpenAISettings");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "MongoConnections");

            migrationBuilder.CreateTable(
                name: "ProfiledQueries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Collection = table.Column<string>(type: "TEXT", nullable: false),
                    ConnectionId = table.Column<int>(type: "INTEGER", nullable: false),
                    ExecutionTimeMs = table.Column<int>(type: "INTEGER", nullable: false),
                    QueryShape = table.Column<string>(type: "TEXT", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfiledQueries", x => x.Id);
                });
        }
    }
}
