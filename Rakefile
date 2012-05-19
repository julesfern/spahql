LIB_NAME = "SpahQL"
LIB_GITHUB_URL = "http://github.com/danski/spahql"
LIB_HOMEPAGE_URL = "http://danski.github.com/spahql"
LIB_LICENSE_TYPE = "MIT"
LIB_DESCRIPTION_SHORT = "A query language for JSON data"
LIB_DESCRIPTION_LONG = "Fetch, filter, modify and make assertions about deep Javascript data structures"
LIB_AUTHORS = ["Dan Glegg"]
LIB_AUTHOR_EMAIL = "dan@angryamoeba.co.uk"
LIB_VERSION = File.open(File.join(File.dirname(__FILE__), "VERSION")).read

require 'rubygems'
require 'bundler'

begin
  Bundler.setup(:default, :development)
rescue Bundler::BundlerError => e
  $stderr.puts e.message
  $stderr.puts "Run `bundle install` to install missing gems"
  exit e.status_code
end
require 'rake'

task :docs do
  puts "Generating src docs using PDOC and prose docs using Nav.js"
  Rake::Task["docs:src"].invoke
  Rake::Task["docs:prose"].invoke
end

desc "Build the javascript application from source. N.B. Google Closure must be in your environment path as compilar.jar"
task :build do |t, args|
  require 'json'
  pwd = File.dirname(__FILE__)

  src_dir = "#{pwd}/src"
  manifest_path = "#{src_dir}/build.json"
  concat_target = "#{pwd}/spahql.js"
  compile_target = "#{pwd}/spahql-min.js"

  puts "Getting build manifest from #{manifest_path}"
  manifest = JSON.parse(File.open(manifest_path).read)
  manifest_files = manifest["files"]
  manifest_js = []
  manifest_files.each do |f|
    f_path = File.join(src_dir, f)
    puts "Reading #{f_path}"
    manifest_js << File.open(f_path).read
  end

  puts "Concatenating source from #{pwd} to #{concat_target}"
  # Load build.json and read each file
  concat_js = manifest_js.join("\n\r\n\r")
  File.open(concat_target, "w") {|f| f.write concat_js }

  puts "Building from #{pwd}/spahql.js to #{compile_target}"
  `java -jar ~/Downloads/compiler.jar --js #{concat_target} --js_output_file #{compile_target}`
end

desc "Runs lint against the client's javascript source. Defaults to the Google Closure linter."
task :lint, :linter do |t, args|
  
end    

namespace :docs do

  desc "Generate the prose docs from the README"
  task :prose do
    require 'maruku'
    require 'liquid'
    require 'fileutils'
    require 'pathname'
    require 'nokogiri'
    
    @doc_input_dir = File.join(File.dirname(__FILE__), "doc-markdown")
    @output_dir = File.join(File.dirname(__FILE__), "doc-html")

    @template = File.read(File.join(@doc_input_dir, "_template.html")).to_s

    # Get all files recursively in input dir
    @input_files = Dir.glob(File.join(@doc_input_dir, "**", "*.mdown"))
    
    # Maps an input path to an output path
    def opath(ipath)
      ipath.gsub(@doc_input_dir, @output_dir).gsub(".mdown", ".html")
    end
    
    def otitle(path)
      File.basename(path, ".mdown").capitalize
    end
    
    def full_title(markup)
      html = Nokogiri::HTML(markup)
      if heading = html.css("h1").first
        heading.text
      else
        nil
      end      
    end
    
    # Build markdown->html database
    @document_map = {}
    @input_files.each do |ifile|
      puts "Preparing to render markdown->markup in #{ifile}"
      puts "------------------------------------------------"
      opts = {}; 
      html = Maruku.new(File.read(ifile).to_s).to_html
      title = full_title(html) || otitle(ifile)
      puts "Processing syntax highlights..."
      
      puts "Done highlighting."
      @document_map[ifile] = {:html=>html, :title=>title}
      puts "Done rendering markdown for #{ifile}. Identified title '#{title}'"
    end
    
    puts "Done rendering markdown. Proceeding to navmap creation and template rendering."
    
    @input_files.each do |ifile|
      # Markdown file and render it
      ofile = opath(ifile)
      title = @document_map[ifile][:title]
      html = @document_map[ifile][:html]
      puts "Preparing to take rendered markdown from #{ifile} into template -> #{ofile}"
      
      # Build a navigation map to all the other files, from this file (relative paths allow localhost access)
      puts "--> Building navigation routes to other pages from this file"
      nav_map = []
      @input_files.each do |sifile|
        sofile = opath(sifile) # This will be the file's rendered location
        sopts = {:title=>@document_map[sifile][:title]}
        if(sofile != ofile)
          # Determine path relativity to this path
          sopts[:href] = Pathname.new(sofile).relative_path_from(Pathname.new(ofile)).to_s
          puts "To get to #{sofile} from #{ofile} you must #{sopts[:href]}"
        end
        nav_map << sopts
      end
      # Inject the source docs
      nav_map << {:title=>"API", :href=>Pathname.new(File.join(@output_dir, "src", "index.html")).relative_path_from(Pathname.new(ofile)).to_s}


      # Build navigation from file map
      nav_html = "<ul>"
      nav_map.each do |opts|
        nav_html << "<li>"
        nav_html << (opts[:href] ? "<a href=\"#{opts[:href].gsub(/^\.\.\//, "")}\">" : "<a class=\"current\" href=\"#\">")
        nav_html << "#{opts[:title]}"
        nav_html << "</a>"
        nav_html << "</li>"
      end
      nav_html << "</ul>"
      
      # Now do the render
      payload = {
        "title" => title,
        "navigation" => nav_html,
        "content" => html,
        "file" => File.basename(ifile).split(".").first
      }
      html_with_template = Liquid::Template.parse(@template).render(payload)
      
      # And finally commit the file
      File.unlink(ofile) if File.exist?(ofile)
      FileUtils.mkdir_p(File.dirname(ofile))
      File.open(ofile, "w") {|f| f.write html_with_template }
    end
  end
  
  desc "Generate the API documentation using PDOC"
  task :src do
    begin
      require 'PDoc' 
    rescue LoadError 
      require 'pdoc'
    end
    require 'json'
    require 'maruku'
    
    src_input_dir = File.join(File.dirname(__FILE__), "src")
    doc_input_dir = File.join(File.dirname(__FILE__), "doc-markdown")
    output_dir = File.join(File.dirname(__FILE__), "doc-html", "src")
    puts "Generating code docs from #{src_input_dir} and prose docs from #{doc_input_dir} => #{output_dir}..."
  
    #if(Dir.exist?(output_dir))
    #  puts "Purging existing doc folder"
    #  Dir.rmdir
    #end
    #Dir.mkdir(output_dir)
    
    PDoc.run({
        :source_files => Dir.glob(File.join(src_input_dir, "/*.js")),
        :index_page=>File.join(File.dirname(__FILE__), "readme.mdown"),
        :destination => output_dir,
        :syntax_highlighter => :pygments,
        :markdown_parser => :maruku,
        :src_code_href => proc { |model|
          "#{LIB_GITHUB_URL}/blob/master/#{model.file.gsub(File.dirname(__FILE__)+"/", "")}##{model.line_number}"
        },
        :pretty_urls => false,
        :bust_cache => true,
        :name => LIB_NAME,
        :short_name => 'SpahQL',
        :home_url => LIB_HOMEPAGE_URL,
        :doc_url => LIB_HOMEPAGE_URL,
        :version => LIB_VERSION,
        :copyright_notice => 'This work is copyright (c) 2011 Angry amoeba ltd, and is released under an MIT license.' 
      })
  end

  desc "Generate all documentation and publish to github (danski only)"
  task :publish do
    puts "-> Generating docs"
    Rake::Task["docs"].invoke
    puts "-> Publishing docs"

    src_branch = "master"
    doc_branch = "gh-pages"

    # Copy to tmp directory
    pwd = File.dirname(__FILE__)
    src_path = File.join(pwd, "doc-html")
    tmp_path = "/tmp/spah-docs"

    puts "Copying docs to tmp path"

    require 'FileUtils'

    `rm -rf #{tmp_path}`
    `cp -r #{src_path} #{tmp_path}`

    puts "Chdir to git repo and saving stash"

    `cd #{pwd}; git stash save`

    puts "Switching to gh-pages branch"

    `cd #{pwd}; git checkout #{doc_branch}; git pull --rebase`

    puts "Bringing page content in"

    `cp -r #{tmp_path}/* #{pwd}`

    puts "Lining up the commit"

    `cd #{pwd}; git add .; git commit -m "Updating docs branch"; git push`

    puts "Pushed."


    # Save stash

  end
end