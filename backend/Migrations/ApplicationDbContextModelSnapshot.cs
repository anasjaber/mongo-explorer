﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

#nullable disable

namespace Backend.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    partial class ApplicationDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "8.0.7");

            modelBuilder.Entity("MongoConnection", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("ConnectionString")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<string>("DatabaseName")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<bool>("IsProfilingActive")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.ToTable("MongoConnections");
                });

            modelBuilder.Entity("ProfiledQuery", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Collection")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("ConnectionId")
                        .HasColumnType("INTEGER");

                    b.Property<int>("ExecutionTimeMs")
                        .HasColumnType("INTEGER");

                    b.Property<string>("QueryShape")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<DateTime>("Timestamp")
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.ToTable("ProfiledQueries");
                });

            modelBuilder.Entity("Query", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("CollectionName")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("ConnectionId")
                        .HasColumnType("INTEGER");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("TEXT");

                    b.Property<string>("Description")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<bool>("IsFavourite")
                        .HasColumnType("INTEGER");

                    b.Property<DateTime?>("LastRun")
                        .HasColumnType("TEXT");

                    b.Property<string>("QueryText")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<int>("RunCount")
                        .HasColumnType("INTEGER");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("ConnectionId");

                    b.ToTable("Queries");
                });

            modelBuilder.Entity("QueryLog", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<TimeSpan>("Duration")
                        .HasColumnType("TEXT");

                    b.Property<int>("QueryId")
                        .HasColumnType("INTEGER");

                    b.Property<string>("QueryText")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<DateTime>("RunAt")
                        .HasColumnType("TEXT");

                    b.Property<string>("RunBy")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("QueryId");

                    b.ToTable("QueryLogs");
                });

            modelBuilder.Entity("Query", b =>
                {
                    b.HasOne("MongoConnection", "Connection")
                        .WithMany()
                        .HasForeignKey("ConnectionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Connection");
                });

            modelBuilder.Entity("QueryLog", b =>
                {
                    b.HasOne("Query", "Query")
                        .WithMany("QueryLogs")
                        .HasForeignKey("QueryId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Query");
                });

            modelBuilder.Entity("Query", b =>
                {
                    b.Navigation("QueryLogs");
                });
#pragma warning restore 612, 618
        }
    }
}
