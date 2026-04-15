#!/usr/bin/env ruby
# frozen_string_literal: true
# =============================================================================
# link_timon_ios.rb
# Registers timon.xcframework and the ObjC bridge files (TimonModule.m/.h,
# timon.h) into the generated Expo iOS project so Xcode compiles and links them.
#
# Run AFTER build_ios.sh and AFTER `npx expo prebuild`:
#   ruby scripts/link_timon_ios.rb
#
# Requires the xcodeproj gem:
#   gem install xcodeproj
# =============================================================================

require 'xcodeproj'
require 'fileutils'

# ── Dynamic Project Discovery ────────────────────────────────────────────────
ios_dir = File.expand_path('../ios', __dir__)
project_paths = Dir.glob(File.join(ios_dir, '*.xcodeproj'))

if project_paths.empty?
  puts "ERROR: No .xcodeproj found in #{ios_dir}. Did you run 'npx expo prebuild' first?"
  exit 1
end

PROJECT_PATH = project_paths.first
TARGET_NAME = File.basename(PROJECT_PATH, '.xcodeproj')
XCFRAMEWORK_PATH = File.join(ios_dir, 'timon.xcframework')
NATIVE_BRIDGE_SRC = File.expand_path('timon-native-bridge', __dir__)
TARGET_GROUP_DIR = File.join(ios_dir, TARGET_NAME)

puts "Discovered Xcode Project: #{PROJECT_PATH}"
puts "Target Name: #{TARGET_NAME}"

# ── 1. Inject Native Wrapper Files into the ios/ Directory ───────────────────
puts "Copying TimonModule wrappers into iOS project folder..."
FileUtils.mkdir_p(TARGET_GROUP_DIR)
['TimonModule.h', 'TimonModule.m'].each do |file|
  src_file = File.join(NATIVE_BRIDGE_SRC, file)
  if File.exist?(src_file)
    FileUtils.cp(src_file, File.join(TARGET_GROUP_DIR, file))
    puts "  ✓ Copied #{file}"
  else
    puts "  ⚠️ WARNING: Source file #{src_file} not found!"
  end
end

# ── 2. Link into Xcode ───────────────────────────────────────────────────────
project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |t| t.name == TARGET_NAME }

if app_target.nil?
  puts "ERROR: Could not find target '#{TARGET_NAME}' in #{PROJECT_PATH}"
  exit 1
end

# ── Clean up any stale references ────────────────────────────────────────────
SOURCE_FILES = %w[TimonModule.m TimonModule.h timon.h].freeze

app_group = project.main_group.find_subpath(TARGET_NAME, true)
app_group.files
         .select { |f| SOURCE_FILES.any? { |name| f.path&.end_with?(name) } }
         .each do |file_ref|
           app_target.source_build_phase.files
                     .select { |bf| bf.file_ref == file_ref }
                     .each(&:remove_from_project)
           file_ref.remove_from_project
         end

# Also purge any compile-phase ghosts
app_target.source_build_phase.files
          .select { |bf| bf.file_ref&.path&.include?('TimonModule') }
          .each(&:remove_from_project)

# ── Add ObjC bridge source files ─────────────────────────────────────────────
module_m = app_group.new_reference('TimonModule.m')
module_h = app_group.new_reference('TimonModule.h')  # header — not compiled
timon_h  = app_group.new_reference('timon.h')         # header — not compiled

# Only .m files go into the compile sources phase
app_target.source_build_phase.add_file_reference(module_m, true)

puts "  ✓ TimonModule.m linked to build sources"
puts "  ✓ TimonModule.h & timon.h linked as references"

# ── Add timon.xcframework ─────────────────────────────────────────────────────
# Ensure it exists physically before linking
unless File.exist?(XCFRAMEWORK_PATH)
  puts "  ⚠️ WARNING: timon.xcframework not found at #{XCFRAMEWORK_PATH}. Ensure build_ios.sh was run."
end

framework_group = project.main_group.find_subpath('Frameworks', true)

# Remove stale xcframework ref if present
stale = framework_group.files.find { |f| f.path&.include?('timon.xcframework') }
stale&.remove_from_project

# Note: We must reference the xcframework correctly as a group reference
xcframework = framework_group.new_reference('timon.xcframework')
app_target.frameworks_build_phase.add_file_reference(xcframework, true)
puts "  ✓ timon.xcframework added to frameworks build phase"

# ── Embed the xcframework (required for dynamic content / code signing) ───────
embed_phase = app_target.build_phases.find do |phase|
  phase.is_a?(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase) &&
    phase.name == 'Embed Frameworks'
end

if embed_phase.nil?
  embed_phase = project.new(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase)
  embed_phase.name = 'Embed Frameworks'
  embed_phase.symbol_dst_subfolder_spec = :frameworks
  app_target.build_phases << embed_phase
  puts "  ✓ 'Embed Frameworks' build phase created"
end

unless embed_phase.files.any? { |bf| bf.file_ref&.path&.include?('timon.xcframework') }
  build_file = embed_phase.add_file_reference(xcframework, true)
  build_file&.settings = { 'ATTRIBUTES' => ['CodeSignOnCopy', 'RemoveHeadersOnCopy'] }
  puts "  ✓ timon.xcframework embedded with CodeSignOnCopy"
end

# ── Save ─────────────────────────────────────────────────────────────────────
project.save
puts ""
puts "✅ Xcode integration complete! Open #{TARGET_NAME}.xcworkspace and build."
